import { test, expect } from "@playwright/test";
test("search, filter, compare, bookmark, board assignment and persistence", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator(".content-card")).toHaveCount(12);
  await page.getByLabel("콘텐츠 검색").fill("수분 세럼");
  await expect(page.locator(".content-card")).toHaveCount(3);
  await page.getByLabel("검색어 지우기").click();
  await page.getByRole("button", { name: "동영상", exact: true }).click();
  await expect(page.locator(".content-card")).toHaveCount(3);
  await page.locator(".tabs button").first().click();
  await expect(page.locator(".content-card")).toHaveCount(12);
  await page.locator(".select-card input").nth(0).check();
  await page.locator(".select-card input").nth(1).check();
  await page.getByRole("button", { name: "비교하기", exact: true }).click();
  await expect(page.locator(".compare-column")).toHaveCount(2);
  await page.getByRole("button", { name: "닫기", exact: true }).click();
  await page.getByLabel("선택 해제").click();
  await page.getByRole("button", { name: "보드 만들기", exact: true }).click();
  await page.getByLabel("보드 이름", { exact: true }).fill("캠페인 E2E");
  await page.getByRole("button", { name: "저장하기", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.locator(".media-open").first().click();
  await page.getByLabel("저장할 보드").selectOption({ label: "캠페인 E2E" });
  await page.getByLabel("콘텐츠 메모").fill("제품 연출 참고 — 영구 저장 확인");
  await page.getByRole("button", { name: "저장하기", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("보드와 메모");
  await page.getByRole("button", { name: "닫기", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "캠페인 E2E" }).click();
  await expect(page.locator(".content-card")).toHaveCount(1);
  await page.locator(".media-open").click();
  await expect(page.getByLabel("콘텐츠 메모")).toHaveValue(
    "제품 연출 참고 — 영구 저장 확인",
  );
  await page.getByRole("button", { name: "닫기", exact: true }).click();
  await page.getByLabel("보드 삭제", { exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "보드 삭제", exact: true })
    .click();
  await page.getByRole("button", { name: "미분류", exact: true }).click();
  await expect(page.locator(".content-card")).toHaveCount(1);
  await page.locator(".media-open").click();
  await expect(page.getByLabel("콘텐츠 메모")).toHaveValue(
    "제품 연출 참고 — 영구 저장 확인",
  );
  expect(errors).toEqual([]);
});
test("source registration and favorite hubs use real local persistence", async ({
  page,
}) => {
  await page.goto("/?page=sources");
  await page
    .getByRole("button", { name: "계정 추가", exact: true })
    .first()
    .click();
  await page.getByLabel("Instagram 사용자 이름").fill("@new_test_account");
  await page.getByLabel("표시 이름").fill("새 테스트 브랜드");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "계정 추가", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.locator(".source-main").filter({ hasText: "new_test_account" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "지금 수집" }).first(),
  ).toBeDisabled();
  await page.getByRole("button", { name: "브랜드 허브", exact: true }).click();
  await page.getByLabel("new_test_account 즐겨찾기").click();
  await page.reload();
  await page.getByRole("button", { name: "즐겨찾기", exact: true }).click();
  await expect(page.locator(".hub-row")).toHaveCount(1);
  await expect(page.locator(".hub-row")).toContainText("new_test_account");
});
test("empty results, download and connection errors are explicit", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("콘텐츠 검색").fill("does-not-exist");
  await expect(page.locator(".empty-state")).toBeVisible();
  await expect(page.getByLabel("검색 결과 CSV 다운로드")).toBeDisabled();
  await page.getByLabel("검색어 지우기").click();
  const download = page.waitForEvent("download");
  await page.getByLabel("검색 결과 CSV 다운로드").click();
  expect((await download).suggestedFilename()).toMatch(/\.csv$/);
  await page.goto("/?page=sources");
  await page
    .getByRole("button", { name: "Instagram 연결", exact: true })
    .click();
  await page.getByLabel("Instagram 계정 ID").fill("123456789");
  await page.getByLabel("액세스 토큰").fill("not-a-real-token");
  await page.route("**/api/connection", (r) =>
    r.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ error: "토큰이 만료되었습니다." }),
    }),
  );
  await page.getByRole("button", { name: "연결 확인 후 저장" }).click();
  await expect(page.getByRole("alert")).toContainText("토큰이 만료되었습니다.");
  await expect(page.getByRole("dialog")).toBeVisible();
});
test("responsive layout and modal keyboard dismissal", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".content-card")).toHaveCount(12);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.getByLabel("메뉴 열기").click();
  await page.getByRole("button", { name: "소스 연결", exact: true }).click();
  await page
    .getByRole("button", { name: "Instagram 연결", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.screenshot({ path: ".research/mobile-qa.png", fullPage: true });
});
test("desktop visual evidence", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".content-card")).toHaveCount(12);
  await page.screenshot({
    path: ".research/desktop-fixture-qa.png",
    fullPage: true,
  });
});

test("topic to brand to expression to creator exploration preserves evidence and backtracking", async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const response = await request.post("/api/monitoring/brands", {
    data: { name: "라운드랩", aliases: ["라운드랩", "round lab"] },
  });
  const brand = await response.json();
  await page.goto("/?page=social");
  await page.getByLabel("분석 키워드").fill("수분크림");
  await page.getByRole("button", { name: "검색", exact: true }).click();
  await expect(page.locator(".metric-card").first()).toContainText("3");
  await page
    .locator(".brand-ranks")
    .getByRole("button", { name: "라운드랩" })
    .click();
  await expect(page.getByLabel("분석 브랜드")).toHaveValue(brand.id);
  await expect(page.locator(".metric-card").first()).toContainText("1");
  await page
    .locator(".keyword-cloud")
    .getByRole("button", { name: "수부지" })
    .click();
  await expect(page.locator(".pivot-panel")).toBeVisible();
  await page
    .getByRole("button", { name: "키워드로 새 탐색", exact: true })
    .click();
  await expect(page.getByLabel("분석 브랜드")).toHaveValue("");
  await expect(page.getByLabel("분석 키워드")).toHaveValue("수부지");
  await expect(page.locator(".metric-card").first()).toContainText("2");
  await page.getByLabel("test_creator 계정의 다른 표현 보기").click();
  await expect(page.getByLabel("분석 키워드")).toHaveValue("");
  await expect(page.locator(".analysis-table")).toContainText("탄력탱탱");
  await expect(
    page.getByRole("navigation", { name: "탐색 경로" }),
  ).toContainText("라운드랩");
  await page
    .getByRole("navigation", { name: "탐색 경로" })
    .getByRole("button", { name: "수분크림 · 라운드랩", exact: true })
    .click();
  await expect(page.getByLabel("분석 브랜드")).toHaveValue(brand.id);
  await expect(page.getByLabel("분석 키워드")).toHaveValue("수분크림");
  await page.screenshot({
    path: ".research/pipeline-fixture-qa.png",
    fullPage: true,
  });
  await request.delete("/api/monitoring/brands/" + brand.id, { data: {} });
  expect(errors).toEqual([]);
});
test("tracking definitions persist without pretending discovery is connected", async ({
  page,
}) => {
  await page.goto("/?page=tracking");
  await page
    .getByRole("button", { name: "추적 조건 추가", exact: true })
    .click();
  await page.getByLabel("이름", { exact: true }).fill("수부지 모니터링 E2E");
  await page.getByLabel("포함 키워드").fill("수부지");
  await page.getByLabel("제외어").fill("품절");
  await page.getByRole("button", { name: "추적 조건 저장하기" }).click();
  await expect(page.locator(".rule-card")).toContainText("수부지 모니터링 E2E");
  await page.reload();
  await expect(page.locator(".coverage-strip")).toContainText(
    "발견 수집 미연결",
  );
  await page
    .getByRole("button", { name: "타겟 멘션 추적", exact: true })
    .click();
  await page
    .getByLabel("분석 추적 SET")
    .selectOption({ label: "수부지 모니터링 E2E" });
  await expect(page.locator(".metric-card").first()).toContainText("2");
  await page.getByRole("button", { name: "추적 관리", exact: true }).click();
  await page.getByLabel("수부지 모니터링 E2E 삭제").click();
  await page.getByRole("button", { name: "조건 삭제 확인" }).click();
  await expect(page.locator(".rule-card")).toHaveCount(0);
});
test("manual ad references are labeled, persisted and searchable", async ({
  page,
}) => {
  await page.goto("/?page=ads");
  await expect(page.locator(".coverage-strip")).toContainText("수동 저장");
  await page
    .getByRole("button", { name: "광고 참고 저장", exact: true })
    .click();
  await page
    .getByLabel("광고 라이브러리 링크")
    .fill("https://www.facebook.com/ads/library/?id=123456789012");
  await page.getByLabel("브랜드", { exact: true }).fill("테스트 브랜드");
  await page
    .getByLabel("광고 카피", { exact: true })
    .fill("테스트 전용 수분크림 카피");
  await page
    .getByRole("button", { name: "광고 저장하기", exact: true })
    .click();
  await expect(page.locator(".ad-card")).toContainText("테스트 전용");
  await page.reload();
  await page.getByLabel("광고 검색", { exact: true }).fill("없는 키워드");
  await expect(page.locator(".ad-card")).toHaveCount(0);
  await page.getByLabel("광고 검색", { exact: true }).fill("수분크림");
  await expect(page.locator(".ad-card")).toHaveCount(1);
  await page.getByRole("button", { name: "수정", exact: true }).click();
  await page.getByRole("button", { name: "저장 해제", exact: true }).click();
  await expect(page.locator(".ad-card")).toHaveCount(0);
});
test("research screens fit mobile and keep metrics in scope", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?page=social&q=수부지");
  await expect(page.locator(".metric-card").first()).toContainText("2");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: ".research/mobile-research-qa.png",
    fullPage: true,
  });
});
