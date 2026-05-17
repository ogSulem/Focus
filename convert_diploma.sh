#!/usr/bin/env bash
set -euo pipefail

# Конвертация Markdown диплома в DOCX через Pandoc.
# Требования: установлен pandoc.
# Опционально: reference.docx для фирменного стиля вуза.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INPUT_MD="${ROOT_DIR}/diploma.md"
OUTPUT_DOCX="${ROOT_DIR}/diploma.docx"
REFERENCE_DOCX="${ROOT_DIR}/reference.docx"

if ! command -v pandoc >/dev/null 2>&1; then
  echo "Ошибка: pandoc не найден. Установите pandoc и повторите запуск." >&2
  exit 1
fi

if [[ ! -f "${INPUT_MD}" ]]; then
  echo "Ошибка: не найден входной файл ${INPUT_MD}" >&2
  exit 1
fi

if [[ -f "${REFERENCE_DOCX}" ]]; then
  pandoc "${INPUT_MD}" \
    --from markdown \
    --to docx \
    --reference-doc "${REFERENCE_DOCX}" \
    --resource-path="${ROOT_DIR}" \
    --standalone \
    --output "${OUTPUT_DOCX}"
else
  pandoc "${INPUT_MD}" \
    --from markdown \
    --to docx \
    --resource-path="${ROOT_DIR}" \
    --standalone \
    --output "${OUTPUT_DOCX}"
fi

echo "Готово: ${OUTPUT_DOCX}"
