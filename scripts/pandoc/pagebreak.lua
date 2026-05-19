local pagebreak_xml = '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'

function RawBlock(el)
  if el.format == 'tex' or el.format == 'latex' then
    if el.text:match('\\newpage') or el.text:match('\\pagebreak') then
      return pandoc.RawBlock('openxml', pagebreak_xml)
    end
  end
end
