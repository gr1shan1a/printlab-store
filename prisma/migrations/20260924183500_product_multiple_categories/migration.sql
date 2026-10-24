CREATE TABLE "_AdditionalCategories" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);
CREATE UNIQUE INDEX "_AdditionalCategories_AB_unique" ON "_AdditionalCategories"("A", "B");
CREATE INDEX "_AdditionalCategories_B_index" ON "_AdditionalCategories"("B");
ALTER TABLE "_AdditionalCategories" ADD CONSTRAINT "_AdditionalCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_AdditionalCategories" ADD CONSTRAINT "_AdditionalCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
