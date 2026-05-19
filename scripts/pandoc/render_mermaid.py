from pathlib import Path
import sys


def render_mermaid(input_md: Path, output_md: Path, mermaid_dir: Path) -> int:
    try:
        text = input_md.read_text()
    except Exception as exc:
        print(
            f"Ошибка: не удалось прочитать {input_md}: {type(exc).__name__}: {exc}",
            file=sys.stderr,
        )
        raise SystemExit(1)

    mermaid_dir.mkdir(parents=True, exist_ok=True)
    lines = text.splitlines()
    out_lines: list[str] = []
    counter = 0
    in_mermaid = False
    buffer: list[str] = []

    for line in lines:
        stripped = line.strip()
        if stripped == "```mermaid" and not in_mermaid:
            in_mermaid = True
            buffer = []
            continue
        if stripped == "```" and in_mermaid:
            counter += 1
            content = "\n".join(buffer).rstrip() + "\n"
            diagram_path = mermaid_dir / f"diagram-{counter}.mmd"
            try:
                diagram_path.write_text(content)
            except Exception as exc:
                print(
                    f"Ошибка: не удалось записать {diagram_path}: {type(exc).__name__}: {exc}",
                    file=sys.stderr,
                )
                raise SystemExit(1)
            out_lines.append(f"![](mermaid/diagram-{counter}.png)")
            in_mermaid = False
            buffer = []
            continue
        if in_mermaid:
            buffer.append(line)
        else:
            out_lines.append(line)

    try:
        output_md.write_text("\n".join(out_lines) + "\n")
    except Exception as exc:
        print(
            f"Ошибка: не удалось записать {output_md}: {type(exc).__name__}: {exc}",
            file=sys.stderr,
        )
        raise SystemExit(1)
    return counter


if __name__ == "__main__":
    if len(sys.argv) != 4:
        raise SystemExit("Usage: render_mermaid.py <input_md> <output_md> <mermaid_dir>")
    input_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])
    mermaid_path = Path(sys.argv[3])
    count = render_mermaid(input_path, output_path, mermaid_path)
    print(count)
