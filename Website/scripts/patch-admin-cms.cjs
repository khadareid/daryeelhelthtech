const fs = require("fs")
const p = require("path").join(
  __dirname,
  "../src/pages/admin/AdminCms.tsx"
)
let c = fs.readFileSync(p, "utf8")
const start = c.indexOf("{isListPageSlug(pageDraft.slug) ? (")
const endMarker =
  ') : null}\n\n              <div className="grid gap-3 sm:grid-cols-2">\n                <div className="space-y-1.5">\n                  <Label>Title</Label>'
const end = c.indexOf(endMarker, start)
if (start < 0 || end < 0) {
  console.error("fail", start, end)
  process.exit(1)
}
const replacement = `{isListPageSlug(pageDraft.slug) ? (
                <AdminCmsListEditor
                  kind={pageDraft.slug}
                  listBody={listBody}
                  setListBody={setListBody}
                  listFilter={listFilter}
                  setListFilter={setListFilter}
                  listTag={listTag}
                  setListTag={setListTag}
                  listTags={listTags}
                  filteredListItems={filteredListItems}
                  editingItemIndex={editingItemIndex}
                  setEditingItemIndex={setEditingItemIndex}
                  updateListItem={updateListItem}
                />
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Title</Label>`
c = c.slice(0, start) + replacement + c.slice(end + endMarker.length)
fs.writeFileSync(p, c)
console.log("ok")
