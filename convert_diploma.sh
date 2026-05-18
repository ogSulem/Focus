#!/usr/bin/env bash
set -euo pipefail

# Конвертация Markdown диплома в DOCX с учетом методических требований.
# Требования: pandoc, python3, node+npx (для mermaid).
# Дополнительно: reference.docx — официальный шаблон вуза (обязателен для полной совместимости).

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INPUT_MD="${ROOT_DIR}/diploma.md"
OUTPUT_DOCX="${ROOT_DIR}/diploma.docx"
REFERENCE_DOCX="${ROOT_DIR}/reference.docx"
PAGEBREAK_FILTER="${ROOT_DIR}/scripts/pandoc/pagebreak.lua"

if ! command -v pandoc >/dev/null 2>&1; then
  echo "Ошибка: pandoc не найден. Установите pandoc и повторите запуск." >&2
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "Ошибка: python3 не найден. Установите Python 3 и повторите запуск." >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1 || ! command -v npx >/dev/null 2>&1; then
  echo "Ошибка: node/npx не найден. Нужен для генерации mermaid-диаграмм." >&2
  exit 1
fi

if [[ ! -f "${INPUT_MD}" ]]; then
  echo "Ошибка: не найден входной файл ${INPUT_MD}" >&2
  exit 1
fi

if [[ ! -f "${REFERENCE_DOCX}" ]]; then
  echo "Ошибка: ${REFERENCE_DOCX} не найден." >&2
  echo "Для полного соответствия методичке положите официальный шаблон Word в reference.docx." >&2
  exit 1
fi

if [[ ! -f "${PAGEBREAK_FILTER}" ]]; then
  echo "Ошибка: не найден фильтр ${PAGEBREAK_FILTER}" >&2
  exit 1
fi

TMP_DIR="$(mktemp -d /tmp/focus-docx-XXXXXX)"
MERMAID_DIR="${TMP_DIR}/mermaid"
RENDERED_MD="${TMP_DIR}/diploma.rendered.md"

cleanup() {
  rm -rf "${TMP_DIR}"
}
trap cleanup EXIT

mkdir -p "${MERMAID_DIR}"

MERMAID_COUNT="$(python3 - "${INPUT_MD}" "${RENDERED_MD}" "${MERMAID_DIR}" <<'PY'
import re
from pathlib import Path
import sys

input_md = Path(sys.argv[1])
output_md = Path(sys.argv[2])
mermaid_dir = Path(sys.argv[3])

text = input_md.read_text()
pattern = re.compile(r"```mermaid\\s*(.*?)```", re.S)
counter = 0

def repl(match):
    global counter
    counter += 1
    content = match.group(1).strip() + "\\n"
    (mermaid_dir / f"diagram-{counter}.mmd").write_text(content)
    return f"![](mermaid/diagram-{counter}.png)\\n"

text = pattern.sub(repl, text)
output_md.write_text(text)
print(counter)
PY
)"

if [[ "${MERMAID_COUNT}" -gt 0 ]]; then
  for ((i=1; i<=MERMAID_COUNT; i++)); do
    npx -y @mermaid-js/mermaid-cli \
      --input "${MERMAID_DIR}/diagram-${i}.mmd" \
      --output "${MERMAID_DIR}/diagram-${i}.png" \
      --theme neutral \
      --backgroundColor transparent \
      --width 1600
  done
fi

pandoc "${RENDERED_MD}" \
  --from markdown+raw_tex \
  --to docx \
  --reference-doc "${REFERENCE_DOCX}" \
  --resource-path="${ROOT_DIR}:${TMP_DIR}" \
  --lua-filter "${PAGEBREAK_FILTER}" \
  --highlight-style tango \
  --metadata lang=ru-RU \
  --standalone \
  --output "${OUTPUT_DOCX}"

echo "Готово: ${OUTPUT_DOCX}"
