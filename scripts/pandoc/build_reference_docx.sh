#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OUTPUT_DOCX="${1:-${ROOT_DIR}/reference.docx}"
TEMPLATE_MD="${ROOT_DIR}/scripts/pandoc/reference-template.md"

if ! command -v pandoc >/dev/null 2>&1; then
  echo "Ошибка: pandoc не найден. Установите pandoc и повторите запуск." >&2
  exit 1
fi

if [[ ! -f "${TEMPLATE_MD}" ]]; then
  echo "Ошибка: не найден шаблон ${TEMPLATE_MD}" >&2
  exit 1
fi

pandoc "${TEMPLATE_MD}" \
  --from markdown+raw_tex \
  --to docx \
  --standalone \
  --metadata lang=ru-RU \
  --output "${OUTPUT_DOCX}"

echo "Готово: ${OUTPUT_DOCX}"
