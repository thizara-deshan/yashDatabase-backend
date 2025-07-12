/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Destination` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Destination" DROP CONSTRAINT "Destination_tourPackageId_fkey";

-- CreateTable
CREATE TABLE "_TourDestinations" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_TourDestinations_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_TourDestinations_B_index" ON "_TourDestinations"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Destination_name_key" ON "Destination"("name");

-- AddForeignKey
ALTER TABLE "_TourDestinations" ADD CONSTRAINT "_TourDestinations_A_fkey" FOREIGN KEY ("A") REFERENCES "Destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TourDestinations" ADD CONSTRAINT "_TourDestinations_B_fkey" FOREIGN KEY ("B") REFERENCES "TourPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
