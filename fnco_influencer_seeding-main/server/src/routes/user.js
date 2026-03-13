import express from "express";
import { pool } from "../config/database.js";

const router = express.Router();

router.get("/user-info/:email", async (req, res) => {
  try {
    const { email } = req.params;
    
    if (!email) {
      return res.status(400).json({ error: "이메일이 필요합니다." });
    }

    const userInfoQuery = `
      WITH user_info AS (
        SELECT DISTINCT user_id, name, name_eng, email, team_code
        FROM fnco_influencer.dw_users 
        WHERE email = $1 OR origin_email = $1
      )
      SELECT 
        (
          SELECT json_agg(row_to_json(enriched))
          FROM (
            SELECT 
              ui.*, 
              (
                SELECT COALESCE(json_agg(urm.role_id), '[]'::json)
                FROM fnco_influencer.dw_user_role_map urm
                WHERE urm.user_id = ui.user_id
              ) AS role
            FROM user_info ui
          ) AS enriched
        ) as user
    `;
    
    const result = await pool.query(userInfoQuery, [email]);
    const data = result.rows[0];

    if (!data.user || data.user.length === 0) {
      return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
    }
    
    res.json({ user: data.user[0] });
    
  } catch (error) {
    console.error("유저 그룹 정보 조회 실패:", error);
    res.status(500).json({ 
      error: "서버 오류가 발생했습니다.",
      details: error.message 
    });
  }
});

// role 목록 조회
router.get("/roles", async (req, res) => {
  try {
    const query = `
      SELECT 
        role_id,
        role_nm,
        created_dt
      FROM fnco_influencer.dw_roles
      ORDER BY created_dt ASC
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("role 목록 조회 실패:", error);
    res.status(500).json({ 
      error: "서버 오류가 발생했습니다.",
      details: error.message 
    });
  }
});


// role별 권한 조회
router.get("/roles/:roleId/permissions", async (req, res) => {
  try {
    const { roleId } = req.params;

    if (!roleId) {
      return res.status(400).json({ error: "role_id가 필요합니다." });
    }

    const query = `
      SELECT 
        rmp.role_id,
        rmp.menu_id,
        rmp.permission_id,
        m.menu_nm,
        p.permission_nm,
        rmp.created_dt
      FROM fnco_influencer.dw_role_menu_permission_map rmp
      LEFT JOIN fnco_influencer.dw_menus m ON rmp.menu_id = m.menu_id
      LEFT JOIN fnco_influencer.dw_permissions p ON rmp.permission_id = p.permission_id
      WHERE rmp.role_id = $1
      ORDER BY created_dt
    `;

    const result = await pool.query(query, [roleId]);
    res.json(result.rows);
  } catch (error) {
    console.error("role별 권한 조회 실패:", error);
    res.status(500).json({ 
      error: "서버 오류가 발생했습니다.",
      details: error.message 
    });
  }
});

// 전체 사용자 목록 조회 (role에 할당되지 않은 사용자 필터링 옵션)
router.get("/users", async (req, res) => {
  try {
    const { excludeRoleId } = req.query;

    let query = `
      SELECT 
        user_id,
        name,
        name_eng,
        email,
        team_code,
        org_name,
        posit_name
      FROM fnco_influencer.dw_users
    `;

    const params = [];

    // 특정 role에 할당되지 않은 사용자만 필터링
    if (excludeRoleId) {
      query += `
        WHERE user_id NOT IN (
          SELECT user_id 
          FROM fnco_influencer.dw_user_role_map 
          WHERE role_id = $1
        )
      `;
      params.push(excludeRoleId);
    }

    query += ` ORDER BY name ASC, email ASC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("사용자 목록 조회 실패:", error);
    res.status(500).json({ 
      error: "서버 오류가 발생했습니다.",
      details: error.message 
    });
  }
});

// role별 사용자 목록 조회
router.get("/roles/:roleId/users", async (req, res) => {
  try {
    const { roleId } = req.params;

    if (!roleId) {
      return res.status(400).json({ error: "role_id가 필요합니다." });
    }

    const query = `
      SELECT 
        urm.user_id,
        urm.role_id,
        urm.create_dt,
        u.name,
        u.org_name,
        u.posit_name,
        u.email,
        u.team_code
      FROM fnco_influencer.dw_user_role_map urm
      LEFT JOIN fnco_influencer.dw_users u ON urm.user_id = u.user_id
      WHERE urm.role_id = $1
      ORDER BY urm.create_dt desc
    `;

    const result = await pool.query(query, [roleId]);
    res.json(result.rows);
  } catch (error) {
    console.error("role별 사용자 목록 조회 실패:", error);
    res.status(500).json({ 
      error: "서버 오류가 발생했습니다.",
      details: error.message 
    });
  }
});

// 사용자 추가
router.post("/users", async (req, res) => {
  const client = await pool.connect();
  try {
    const { user_id, name, name_eng, email, team_code, role_id } = req.body;

    if (!user_id || !email) {
      return res.status(400).json({ error: "user_id와 email은 필수입니다." });
    }

    if (!role_id) {
      return res.status(400).json({ error: "role_id는 필수입니다." });
    }

    await client.query("BEGIN");

    // 사용자 존재 여부 확인
    const existingUser = await client.query(
      "SELECT user_id FROM fnco_influencer.dw_users WHERE user_id = $1",
      [user_id]
    );

    // 사용자가 없으면 생성
    if (existingUser.rows.length === 0) {
      await client.query(
        `INSERT INTO fnco_influencer.dw_users 
         (user_id, name, name_eng, email, team_code) 
         VALUES ($1, $2, $3, $4, $5)`,
        [user_id, name || null, name_eng || null, email, team_code || null]
      );
    } else {
      // 사용자가 있으면 업데이트 (선택적 필드만)
      if (name || name_eng || team_code) {
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        if (name) {
          updateFields.push(`name = $${paramIndex++}`);
          updateValues.push(name);
        }
        if (name_eng) {
          updateFields.push(`name_eng = $${paramIndex++}`);
          updateValues.push(name_eng);
        }
        if (team_code) {
          updateFields.push(`team_code = $${paramIndex++}`);
          updateValues.push(team_code);
        }
        if (email) {
          updateFields.push(`email = $${paramIndex++}`);
          updateValues.push(email);
        }

        updateValues.push(user_id);
        await client.query(
          `UPDATE fnco_influencer.dw_users 
           SET ${updateFields.join(", ")} 
           WHERE user_id = $${paramIndex}`,
          updateValues
        );
      }
    }

    // role 매핑 확인 및 추가
    const existingMapping = await client.query(
      `SELECT user_role_id FROM fnco_influencer.dw_user_role_map 
       WHERE user_id = $1 AND role_id = $2`,
      [user_id, role_id]
    );

    if (existingMapping.rows.length === 0) {
      await client.query(
        `INSERT INTO fnco_influencer.dw_user_role_map (user_id, role_id) 
         VALUES ($1, $2)`,
        [user_id, role_id]
      );
    }

    await client.query("COMMIT");

    res.json({ 
      success: true, 
      message: "사용자가 성공적으로 추가되었습니다.",
      user_id,
      role_id 
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("사용자 추가 실패:", error);
    
    // 중복 키 에러 처리
    if (error.code === "23505") {
      return res.status(409).json({ 
        error: "이미 존재하는 사용자 또는 역할 매핑입니다.",
        details: error.message 
      });
    }
    
    res.status(500).json({ 
      error: "서버 오류가 발생했습니다.",
      details: error.message 
    });
  } finally {
    client.release();
  }
});

// 사용자 삭제 (role에서 제거)
router.delete("/roles/:roleId/users/:userId", async (req, res) => {
  const client = await pool.connect();
  try {
    const { roleId, userId } = req.params;

    if (!roleId || !userId) {
      return res.status(400).json({ error: "role_id와 user_id가 필요합니다." });
    }

    await client.query("BEGIN");

    // role 매핑 삭제
    const deleteResult = await client.query(
      `DELETE FROM fnco_influencer.dw_user_role_map 
       WHERE user_id = $1 AND role_id = $2`,
      [userId, roleId]
    );

    if (deleteResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ 
        error: "해당 사용자와 역할 매핑을 찾을 수 없습니다." 
      });
    }

    await client.query("COMMIT");

    res.json({ 
      success: true, 
      message: "사용자가 성공적으로 삭제되었습니다.",
      user_id: userId,
      role_id: roleId 
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("사용자 삭제 실패:", error);
    
    res.status(500).json({ 
      error: "서버 오류가 발생했습니다.",
      details: error.message 
    });
  } finally {
    client.release();
  }
});

export default router;

// 사용자 ID로 기본 정보와 메뉴-권한 맵 조회
router.get("/user-access/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "user_id가 필요합니다." });
    }

    const query = `
      WITH ui AS (
        SELECT DISTINCT user_id, name, name_eng, email
        FROM fnco_influencer.dw_users
        WHERE user_id = $1
      )
      SELECT 
        ui.user_id,
        ui.name,
        ui.name_eng,
        ui.email,
        (
          SELECT json_object_agg(menu_key, permissions)
          FROM (
            SELECT 
              m.menu_id AS menu_key,
              json_agg(DISTINCT p.permission_id) AS permissions
            FROM fnco_influencer.dw_user_role_map urm
            JOIN fnco_influencer.dw_roles r ON urm.role_id = r.role_id
            JOIN fnco_influencer.dw_role_menu_permission_map rmp ON r.role_id = rmp.role_id
            JOIN fnco_influencer.dw_menus m ON rmp.menu_id = m.menu_id
            JOIN fnco_influencer.dw_permissions p ON rmp.permission_id = p.permission_id
            WHERE urm.user_id = ui.user_id
            GROUP BY m.menu_id
          ) t
        ) AS menu
      FROM ui ui
    `;

    const result = await pool.query(query, [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
    }

    const row = result.rows[0];
    // menu가 null이면 빈 객체로 처리
    const response = {
      user_id: row.user_id,
      name: row.name,
      name_eng: row.name_eng,
      email: row.email,
      menu: row.menu || {}
    };

    res.json(response);
  } catch (error) {
    console.error("user_id로 유저 정보 조회 실패:", error);
    res.status(500).json({ 
      error: "서버 오류가 발생했습니다.",
      details: error.message 
    });
  }
});