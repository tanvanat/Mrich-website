# npx prisma migrate dev
-Version control ของ schema database
-Prisma จะทำ 4 อย่างเรียงลำดับนี้:

1.อ่าน schema.prisma
2.เปรียบเทียบกับโครงสร้าง DB จริง (PostgreSQL)
3.สร้างไฟล์ migration.sql (ถ้ามีการเปลี่ยน schema)
4.รัน SQL นั้นกับ database

