import { pool } from '../config/database.js';

// Auto-create table on first use
const CREATE_TABLE = `
  CREATE TABLE IF NOT EXISTS fnco_influencer.dw_hook_bank (
    hook_id SERIAL PRIMARY KEY,
    campaign_id VARCHAR(64) NOT NULL,
    arc_phase VARCHAR(20) NOT NULL,
    hook_type VARCHAR(30) NOT NULL,
    hook_text TEXT NOT NULL,
    channel VARCHAR(50),
    variant_group VARCHAR(50),
    performance_score NUMERIC(5,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft',
    metadata JSONB DEFAULT '{}',
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

let tableCreated = false;

async function ensureTable() {
  if (!tableCreated) {
    await pool.query(CREATE_TABLE);
    tableCreated = true;
  }
}

// 훅 목록 조회 (캠페인별, 필터 지원)
export const getHooks = async (req, res) => {
  try {
    await ensureTable();
    const campaignId = req.params.id;
    const { phase, type } = req.query;

    let query = 'SELECT * FROM fnco_influencer.dw_hook_bank WHERE campaign_id = $1';
    const params = [campaignId];
    let paramIdx = 2;

    if (phase) {
      query += ` AND arc_phase = $${paramIdx}`;
      params.push(phase);
      paramIdx++;
    }

    if (type) {
      query += ` AND hook_type = $${paramIdx}`;
      params.push(type);
      paramIdx++;
    }

    query += ' ORDER BY arc_phase, hook_type, variant_group, hook_id';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('[getHooks]', error);
    res.status(500).json({ error: '훅 목록 조회 중 오류가 발생했습니다.', details: error.message });
  }
};

// 채널별 특화 훅 텍스트
const CHANNEL_HOOK_TEMPLATES = {
  tease: {
    tiktok: {
      headline: ['3초 안에 눈 못 떼게 만드는 피부 비밀', '끝까지 보면 피부가 달라진다'],
      opening_line: ['잠깐, 이거 진짜야?', '피부가 이렇게 바뀔 수 있다고?'],
      cta: ['팔로우하고 다음 편에서 공개!', '프로필 링크에서 확인 →'],
      hashtag: ['#피부꿀팁 #틱톡뷰티 #완시청', '#스킨케어틱톡 #뷰티해킹'],
    },
    instagram: {
      headline: ['친구한테 바로 보내야 하는 피부 정보', '이 스토리 캡쳐해서 간직하세요'],
      opening_line: ['이거 나만 알기 아까워서...', '피부 고민 있는 친구 태그해주세요'],
      cta: ['DM으로 친구에게 공유하기 →', '저장해뒀다가 나중에 확인하세요'],
      hashtag: ['#뷰티그램 #인스타뷰티 #공유필수', '#스킨케어추천 #뷰티스타그램'],
    },
    youtube: {
      headline: ['2026 스킨케어 트렌드 총정리', '피부과 의사가 절대 안 알려주는 것'],
      opening_line: ['끝까지 보시면 피부 관리법이 달라집니다', '구독자분들이 가장 많이 물어보신 질문'],
      cta: ['구독하고 다음 리뷰 알림 받기', '성분 분석은 영상 설명란에서'],
      hashtag: ['#스킨케어리뷰 #뷰티유튜브 #피부과추천', '#화장품성분분석 #뷰티추천'],
    },
  },
  reveal: {
    tiktok: {
      headline: ['이 제품 써봤는데 진짜 미쳤음', '드디어 공개! 3초 컷 변화'],
      opening_line: ['처음 발랐을 때 소름 돋았어요', '이건 진짜 다르다... 설명 불가'],
      cta: ['지금 바로 확인하기 →', '한정 수량이라 서두르세요'],
      hashtag: ['#신제품 #틱톡추천 #언박싱', '#뷰티신상 #솔직리뷰 #대박템'],
    },
    instagram: {
      headline: ['드디어 공개! 이건 저장 필수', '인스타 뷰티 덕후들 주목!'],
      opening_line: ['수많은 테스트 끝에 완성된 제품 소개', '이 릴스 친구한테 꼭 보내주세요'],
      cta: ['프로필 링크에서 상세 확인', '저장하고 나중에 구매하세요 →'],
      hashtag: ['#신제품공개 #뷰티신상 #릴스추천', '#인스타뷰티 #꿀조합 #저장필수'],
    },
    youtube: {
      headline: ['피부과 전문의가 만든 제품 성분 분석', '3년 연구 끝에 탄생한 차세대 스킨케어'],
      opening_line: ['오늘 상세하게 리뷰해드리겠습니다', '성분부터 사용감까지 꼼꼼히 분석했어요'],
      cta: ['전체 성분표 영상 설명란 확인', '구독하고 2주 사용 후기 알림 받기'],
      hashtag: ['#제품리뷰 #성분분석 #유튜브뷰티', '#스킨케어추천 #언박싱리뷰 #전문가리뷰'],
    },
  },
  validate: {
    tiktok: {
      headline: ['실사용 2주, 결과 보여드림', '비포애프터 보고 판단하세요'],
      opening_line: ['솔직히 말해볼게요, 다 좋진 않았어요', '근데 진짜 달라진 건 맞음'],
      cta: ['댓글로 궁금한 거 물어보세요', '다음 영상에서 더 자세히!'],
      hashtag: ['#솔직후기 #비포애프터 #틱톡리뷰', '#인생템 #리얼후기 #뷰티틱톡'],
    },
    instagram: {
      headline: ['2주 사용 리얼 후기 — 친구한테 보내세요', '비포&애프터 인증! DM으로 질문 받아요'],
      opening_line: ['솔직 후기입니다. 좋은 점도 아쉬운 점도 다 말할게요', 'before/after 사진 먼저 보시고 판단해주세요'],
      cta: ['실제 후기 더 보기 → 프로필 링크', 'DM으로 사용법 물어보세요'],
      hashtag: ['#실사용후기 #뷰티꿀템 #인생템', '#솔직리뷰 #비포애프터 #인스타뷰티'],
    },
    youtube: {
      headline: ['실사용 30일 완전 분석 리뷰', '피부과 전문의도 인정한 성분 분석'],
      opening_line: ['30일간 꾸준히 사용해봤습니다, 결론부터 말씀드리면', '타임스탬프 달아뒀으니 궁금한 부분만 보셔도 됩니다'],
      cta: ['성분 분석 리포트 설명란에서 확인', '나에게 맞는 제품인지 테스트 →'],
      hashtag: ['#성분분석 #더마코스메틱 #유튜브리뷰', '#피부과추천 #장기사용후기 #뷰티분석'],
    },
  },
  amplify: {
    tiktok: {
      headline: ['10만 명이 선택한 이유 30초 요약', '품절 전에 빨리 사세요 진심'],
      opening_line: ['주변에서 "뭐 바꿨어?" 질문 폭주', '재구매율 87%, 숫자가 말해줌'],
      cta: ['프로필 링크에서 특가 확인 →', '이 영상 저장해두면 할인 코드 있어요'],
      hashtag: ['#뷰티대란 #품절주의 #틱톡쇼핑', '#인생템 #공구 #뷰티할인'],
    },
    instagram: {
      headline: ['올리브영 1위 — 친구 태그하고 같이 구매!', '리뷰 5,000개 돌파 기념 이벤트'],
      opening_line: ['이 제품 하나로 아침 루틴이 완전히 바뀌었어요', '친구 태그하면 할인 코드 드려요'],
      cta: ['친구 태그하고 함께 할인받으세요!', '한정 기간 특가, 스토리로 공유하기 →'],
      hashtag: ['#공구오픈 #뷰티할인 #인스타이벤트', '#인생템인증 #리뷰이벤트 #뷰티그램'],
    },
    youtube: {
      headline: ['6개월 장기 사용 최종 리뷰 — 추천 vs 비추천', '가성비 스킨케어 TOP 5 비교 분석'],
      opening_line: ['6개월간 써본 최종 결론을 말씀드리겠습니다', '댓글로 요청 많았던 비교 리뷰 드디어 올립니다'],
      cta: ['구매 링크 영상 설명란 확인', '다른 추천 제품 리뷰도 확인하세요 →'],
      hashtag: ['#장기리뷰 #가성비스킨케어 #유튜브추천', '#최종리뷰 #비교분석 #뷰티유튜버'],
    },
  },
};

// Mock AI 훅 생성 (4 phases x 4 types x 3 channels x 2 variants = 96 hooks)
export const generateHooks = async (req, res) => {
  try {
    await ensureTable();
    const campaignId = req.params.id;

    // 기존 훅 삭제
    await pool.query(
      'DELETE FROM fnco_influencer.dw_hook_bank WHERE campaign_id = $1',
      [campaignId]
    );

    const phases = ['tease', 'reveal', 'validate', 'amplify'];
    const types = ['headline', 'opening_line', 'cta', 'hashtag'];

    // Korean beauty marketing mock hooks per phase/type (fallback)
    const hookTemplates = {
      tease: {
        headline: [
          '매일 아침 거울 보면서 한숨 쉰 적 있나요?',
          '피부 나이, 실제 나이보다 10살 더 먹어 보인다면?',
          '요즘 피부가 칙칙해졌다고 느끼시나요?',
          '화장이 안 먹는 날, 그 원인을 아시나요?',
        ],
        opening_line: [
          '솔직히 말해볼게요. 피부 고민, 다들 있잖아요',
          '저도 한때는 피부 때문에 자신감이 바닥이었어요',
          '화장품 리뷰만 수백 개 읽어봤는데 결국…',
          '친구들이 "너 피부 왜 그래?" 했을 때의 그 기분',
        ],
        cta: [
          '궁금하지 않으세요? 곧 공개됩니다',
          '알림 설정하고 가장 먼저 만나보세요',
          '내일, 모든 것이 달라집니다 →',
        ],
        hashtag: [
          '#피부고민 #뷰티시크릿 #곧공개',
          '#스킨케어일기 #리얼후기예고 #기대해',
          '#피부혁명 #뷰티꿀팁 #티징',
        ],
      },
      reveal: {
        headline: [
          '드디어 공개합니다 — 피부과 전문의가 만든 그 제품',
          '3년 연구 끝에 탄생한 차세대 스킨케어',
          '인플루언서들이 먼저 써보고 놀란 이유',
          '성분 하나하나, 과학으로 증명했습니다',
        ],
        opening_line: [
          '오늘 드디어 보여드릴 수 있게 되었어요!',
          '수많은 테스트를 거쳐 완성된 제품을 소개합니다',
          '직접 써보고 깜짝 놀랐어요, 이건 진짜 다릅니다',
          '처음 발랐을 때 느낌이… 말로 설명이 안 돼요',
        ],
        cta: [
          '지금 바로 확인하기 →',
          '제품 상세 보러가기',
          '한정 수량, 놓치지 마세요 →',
        ],
        hashtag: [
          '#신제품공개 #뷰티신상 #스킨케어추천',
          '#제품리뷰 #언박싱 #첫인상',
          '#뷰티덕후 #화장품추천 #꿀조합',
        ],
      },
      validate: {
        headline: [
          '2주 사용 후기 — 솔직하게 말씀드립니다',
          '실사용 30일, 진짜 변화가 있었을까?',
          '비포&애프터로 증명하는 리얼 후기',
          '피부과 전문의도 인정한 성분 분석',
        ],
        opening_line: [
          '솔직 후기입니다. 좋은 점도 아쉬운 점도 다 말할게요',
          '2주간 꾸준히 사용해봤습니다. 결론부터 말씀드리면…',
          'before/after 사진 먼저 보시고 판단해주세요',
          '댓글로 많이 물어보셨던 부분, 오늘 총정리합니다',
        ],
        cta: [
          '실제 후기 더 보기 →',
          '성분 분석 리포트 확인',
          '나에게 맞는 제품인지 테스트해보세요',
        ],
        hashtag: [
          '#실사용후기 #뷰티꿀템 #인생템',
          '#솔직리뷰 #비포애프터 #피부변화',
          '#성분분석 #더마코스메틱 #피부과추천',
        ],
      },
      amplify: {
        headline: [
          '10만 명이 선택한 이유가 있습니다',
          '품절 대란! 재입고 알림 신청하세요',
          '올리브영 1위 — 이미 검증된 제품',
          '리뷰 5,000개 돌파 기념 특별 이벤트',
        ],
        opening_line: [
          '이 제품 하나로 아침 루틴이 완전히 바뀌었어요',
          '주변에서 "뭐 바꿨어?" 질문 폭주 중입니다',
          '재구매율 87% — 숫자가 말해주는 만족도',
          '직접 써본 사람만 아는 그 느낌, 공유합니다',
        ],
        cta: [
          '지금 구매하면 20% 할인 →',
          '친구 태그하고 함께 할인받으세요!',
          '한정 기간 특가, 오늘이 마지막 →',
        ],
        hashtag: [
          '#뷰티대란 #올영추천 #품절주의',
          '#공구오픈 #뷰티할인 #특가알림',
          '#인생템인증 #리뷰이벤트 #뷰티스타그램',
        ],
      },
    };

    const hooks = [];
    const channels = ['tiktok', 'instagram', 'youtube'];
    const variants = ['A', 'B'];

    for (const phase of phases) {
      for (const type of types) {
        for (const channel of channels) {
          const templates = CHANNEL_HOOK_TEMPLATES[phase]?.[channel]?.[type] || hookTemplates[phase][type];
          const count = Math.min(templates.length, variants.length);
          for (let i = 0; i < count; i++) {
            hooks.push({
              campaign_id: campaignId,
              arc_phase: phase,
              hook_type: type,
              hook_text: templates[i],
              channel: channel,
              variant_group: variants[i],
              status: 'draft',
            });
          }
        }
      }
    }

    // Batch insert — now with 7 columns including channel
    const insertValues = [];
    const insertParams = [];
    let idx = 1;

    for (const hook of hooks) {
      insertValues.push(`($${idx}, $${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, $${idx + 5}, $${idx + 6})`);
      insertParams.push(
        hook.campaign_id,
        hook.arc_phase,
        hook.hook_type,
        hook.hook_text,
        hook.channel,
        hook.variant_group,
        hook.status
      );
      idx += 7;
    }

    const insertQuery = `
      INSERT INTO fnco_influencer.dw_hook_bank
        (campaign_id, arc_phase, hook_type, hook_text, channel, variant_group, status)
      VALUES ${insertValues.join(', ')}
      RETURNING *
    `;

    const result = await pool.query(insertQuery, insertParams);

    res.status(201).json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      message: `${result.rows.length}개의 훅이 생성되었습니다.`,
    });
  } catch (error) {
    console.error('[generateHooks]', error);
    res.status(500).json({ error: '훅 생성 중 오류가 발생했습니다.', details: error.message });
  }
};

// 훅 단건 수정
export const updateHook = async (req, res) => {
  try {
    await ensureTable();
    const { hookId } = req.params;
    const { hook_text, status, performance_score, channel, variant_group, metadata } = req.body;

    const setClauses = [];
    const params = [];
    let paramIdx = 1;

    if (hook_text !== undefined) {
      setClauses.push(`hook_text = $${paramIdx}`);
      params.push(hook_text);
      paramIdx++;
    }
    if (status !== undefined) {
      setClauses.push(`status = $${paramIdx}`);
      params.push(status);
      paramIdx++;
    }
    if (performance_score !== undefined) {
      setClauses.push(`performance_score = $${paramIdx}`);
      params.push(performance_score);
      paramIdx++;
    }
    if (channel !== undefined) {
      setClauses.push(`channel = $${paramIdx}`);
      params.push(channel);
      paramIdx++;
    }
    if (variant_group !== undefined) {
      setClauses.push(`variant_group = $${paramIdx}`);
      params.push(variant_group);
      paramIdx++;
    }
    if (metadata !== undefined) {
      setClauses.push(`metadata = $${paramIdx}`);
      params.push(JSON.stringify(metadata));
      paramIdx++;
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: '수정할 필드가 없습니다.' });
    }

    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(hookId);

    const query = `
      UPDATE fnco_influencer.dw_hook_bank
      SET ${setClauses.join(', ')}
      WHERE hook_id = $${paramIdx}
      RETURNING *
    `;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '훅을 찾을 수 없습니다.' });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('[updateHook]', error);
    res.status(500).json({ error: '훅 수정 중 오류가 발생했습니다.', details: error.message });
  }
};

// 훅 단건 삭제
export const deleteHook = async (req, res) => {
  try {
    await ensureTable();
    const { hookId } = req.params;

    const result = await pool.query(
      'DELETE FROM fnco_influencer.dw_hook_bank WHERE hook_id = $1 RETURNING *',
      [hookId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '삭제할 훅을 찾을 수 없습니다.' });
    }

    res.json({
      success: true,
      message: '훅이 삭제되었습니다.',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('[deleteHook]', error);
    res.status(500).json({ error: '훅 삭제 중 오류가 발생했습니다.', details: error.message });
  }
};
