import { pool, testConnection } from "./src/config/database.js";

async function testDB() {
  console.log("=== PostgreSQL 연결 테스트 시작 ===\n");

  // 1. 연결 테스트
  const isConnected = await testConnection();

  if (!isConnected) {
    console.log("\n❌ 연결 실패");
    process.exit(1);
  }

  try {
    // 2. 간단한 쿼리 테스트
    console.log("\n📊 데이터베이스 정보 조회 중...");
    const result = await pool.query("SELECT * FROM fnco_influencer.mst_post;");
    console.log("PostgreSQL :", result.rows);

    console.log("\n=== 테스트 완료 ===");
  } catch (error) {
    console.error("\n❌ 쿼리 실행 실패:", error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

testDB();
