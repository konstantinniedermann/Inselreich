import contextlib
import io
import tempfile
import unittest
from pathlib import Path

import tablecheck


def problems(text: str) -> list[str]:
    return tablecheck.check_text("f.md", text)


HEAD = "| a | b |\n| --- | --- |\n"


class TableCheckTest(unittest.TestCase):
    def test_valid_table_is_quiet(self):
        self.assertEqual(problems(HEAD + "| 1 | `x` |\n"), [])

    def test_pipe_in_code_span_reports_line(self):
        found = problems(HEAD + "| a | `x|y` |\n")
        self.assertEqual(len(found), 1)
        self.assertTrue(found[0].startswith("f.md:3: "))

    def test_escaped_pipe_is_quiet(self):
        self.assertEqual(problems(HEAD + "| a | `x\\|y` |\n"), [])

    def test_codeblock_is_ignored(self):
        text = "```\n" + HEAD + "| a | `x|y` |\n```\n"
        self.assertEqual(problems(text), [])

    def test_pipe_outside_table_is_quiet(self):
        self.assertEqual(problems("Text mit a | b | c\n\nnoch `x|y`\n"), [])

    def test_shorter_row_is_quiet(self):
        self.assertEqual(problems(HEAD + "| 1 |\n"), [])

    def test_indented_table_in_list_is_checked(self):
        text = "- Punkt\n\n  " + HEAD.replace("\n|", "\n  |") + "  | a | `x|y` |\n"
        found = problems(text)
        self.assertEqual(len(found), 1)
        self.assertIn(":5: ", found[0])

    def test_quoted_table_is_checked(self):
        text = "> | a | b |\n> | --- | --- |\n> | a | `x|y` |\n"
        found = problems(text)
        self.assertEqual(len(found), 1)
        self.assertIn(":3: ", found[0])

    def test_odd_backticks_in_cell_reported(self):
        self.assertEqual(len(problems(HEAD + "| a | `b |\n")), 1)

    def test_even_backticks_in_cell_quiet(self):
        self.assertEqual(problems(HEAD + "| `a` | `b` |\n"), [])

    def test_tilde_fence_with_inner_backtick_fence_stays_open(self):
        bad = HEAD + "| a | `x|y` |\n"
        text = "~~~\n```\n" + bad + "```\n~~~\n"
        self.assertEqual(problems(text), [])

    def test_long_fence_ignores_shorter_inner_fence(self):
        bad = HEAD + "| a | `x|y` |\n"
        text = "````\n```\n" + bad + "```\n````\n"
        self.assertEqual(problems(text), [])

    def test_table_after_fence_is_checked_again(self):
        text = "````\n```\n````\n" + HEAD + "| a | `x|y` |\n"
        self.assertEqual(len(problems(text)), 1)

    def test_double_backtick_span_with_single_backtick_is_quiet(self):
        self.assertEqual(problems(HEAD + "| ``a`b`` | `c` |\n"), [])

    def test_unmatched_run_length_is_reported(self):
        self.assertEqual(len(problems(HEAD + "| ``a` | b |\n")), 1)

    def test_table_ends_at_blank_line(self):
        self.assertEqual(problems(HEAD + "| 1 | 2 |\n\n| x | y | z |\n"), [])


class MainTest(unittest.TestCase):
    def run_main(self, *paths):
        out = io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(out):
            code = tablecheck.main([str(p) for p in paths])
        return code, out.getvalue()

    def test_exit_codes(self):
        with tempfile.TemporaryDirectory() as tmp:
            good, bad = Path(tmp) / "g.md", Path(tmp) / "b.md"
            good.write_text(HEAD + "| 1 | 2 |\n", "utf-8")
            bad.write_text(HEAD + "| a | `x|y` |\n", "utf-8")
            self.assertEqual(self.run_main(good)[0], 0)
            code, out = self.run_main(good, bad)
            self.assertEqual(code, 1)
            self.assertIn("b.md:3: ", out)

    def test_unreadable_file_gives_hint_and_exit_0(self):
        with tempfile.TemporaryDirectory() as tmp:
            binary = Path(tmp) / "x.md"
            binary.write_bytes(b"\xff\xfe\x00 | a")
            code, out = self.run_main(binary, Path(tmp) / "fehlt.md")
            self.assertEqual(code, 0)
            self.assertIn("Hinweis", out)


if __name__ == "__main__":
    unittest.main()
