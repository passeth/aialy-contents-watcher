# Meta에서 Instagram 읽기 연결 준비하기

처음 연결하는 운영자를 위한 안내입니다. Aialy는 현재 **Instagram API with Facebook Login** 방식으로 `graph.facebook.com`에 요청합니다. 다른 로그인 방식의 토큰과 혼용하지 마세요. 아래 안내는 2026-10-13에 공식 시작 가이드와 Business Discovery 문서, 현재 앱의 연결 화면을 확인해 작성했습니다. Meta의 메뉴 이름은 계정과 앱 유형에 따라 달라질 수 있습니다.

## 무엇을 준비하나요?

Aialy의 **소스 연결 → Instagram 연결**에 넣을 값은 세 가지입니다.

| 항목 | 뜻 | 혼동하기 쉬운 값 |
| --- | --- | --- |
| 액세스 토큰 | Meta가 허용한 읽기 요청에 사용하는 인증 값 | 앱 ID나 앱 시크릿이 아닙니다. |
| Instagram 계정 ID | 연결에 사용할 프로페셔널 계정의 숫자 ID | `@사용자이름`, Facebook 페이지 ID와 다릅니다. |
| Graph API 버전 | 요청할 API 버전 | 현재 Aialy의 기본·검증 버전은 `v26.0`입니다. |

Meta 앱은 연결 프로그램을 등록하는 그릇이고, 토큰은 실제 요청 권한입니다. 앱을 만들었다고 토큰이 자동으로 Aialy에 연결되지는 않습니다. 여기서 말하는 연결 인증은 프로필의 파란 인증 배지를 구매하는 절차가 아닙니다.

## 1. 계정과 페이지 연결 확인

연결 주체로 사용할 Instagram 계정은 **비즈니스 또는 크리에이터 계정**이어야 하며 Facebook 페이지와 연결돼 있어야 합니다. 개발자 계정으로 로그인한 Facebook 사용자가 그 페이지에서 필요한 작업 권한을 갖는지도 확인하세요. [Meta 공식 시작 안내](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/get-started)

Meta Business Suite의 설정에서 페이지와 Instagram 자산, 본인에게 할당된 권한을 확인합니다. 계정 이름이 목록에 보이는 것과 API 접근 권한이 있는 것은 별개입니다. 회사가 연결한 다른 브랜드나 바이어 계정을 임의로 자사 소유로 분류하지 마세요.

## 2. 전용 Meta 앱 준비

[Meta 개발자 앱 목록](https://developers.facebook.com/apps/)에서 앱을 만들고 이름을 정합니다. 예: `My Contents Watcher`. Facebook Login 기반 Instagram API에 맞는 사용 사례와 제품을 선택합니다. 앱 대시보드의 안내에 따라 Instagram API 및 Facebook Login 관련 설정을 확인하세요.

앱 관리자·개발자·테스터 등 역할과 실제 자산 권한을 갖춘 사용자로 먼저 테스트합니다. 비밀번호 재확인이나 2단계 인증이 나타나면 본인이 Meta 화면에서 완료합니다. 인증번호를 GitHub 이슈나 다른 사람에게 전달할 필요는 없습니다.

## 3. 읽기 권한을 선택하고 토큰 발급

[Graph API 탐색기](https://developers.facebook.com/tools/explorer/)에서 **방금 만든 앱**을 선택합니다. 사용자 액세스 토큰을 생성하는 흐름에서 필요한 페이지와 Instagram 자산을 허용합니다. Aialy의 현재 계정 읽기 연결에 사용하는 권한은 아래와 같습니다.

| 권한 | 용도 |
| --- | --- |
| `instagram_basic` | 연결한 Instagram 프로페셔널 계정의 기본 정보·미디어 읽기 |
| `pages_show_list` | 접근 가능한 페이지를 찾아 연결 계정 ID 확인 |
| `pages_read_engagement` | 페이지 관련 읽기 및 Business Discovery에 필요한 권한 확인 |
| `instagram_manage_insights` | 인사이트 확장 시 별도로 검토. 현재 Aialy는 비공개 인사이트를 수집하지 않습니다. |

처음에는 필요한 읽기 범위만 준비하세요. 게시·댓글 관리·메시지·광고 관리 권한은 현재 수집기를 위해 추가하지 않습니다. 계정 권한 부여 방식에 따라 추가 조건이 있을 수 있으므로 실제 요청 오류와 해당 엔드포인트의 권한 설명을 확인합니다. [Meta 공식 Instagram API 컬렉션](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api?entity=request-23987686-894be833-d0b6-4877-859e-c61ae6474d64)

## 4. 숫자 Instagram 계정 ID 확인

Graph API 탐색기의 토큰 입력 영역에 발급된 **사용자 토큰**을 선택한 상태에서 아래 GET 요청을 순서대로 실행합니다. 토큰을 URL에 직접 덧붙이거나 이 문서에 붙여 넣지 않습니다.

```text
me/accounts?fields=id,name
```

내 Instagram 계정과 연결된 Facebook 페이지를 찾아 그 `id`를 다음 요청에 사용합니다.

```text
<PAGE_ID>?fields=instagram_business_account
```

응답의 `instagram_business_account.id`가 Aialy에 넣을 숫자 ID입니다. 바깥쪽 `id`는 Facebook 페이지 ID이므로 구분하세요. 마지막으로 본인 계정이 맞는지 확인합니다.

```text
<IG_USER_ID>?fields=id,username
```

이는 Meta가 안내하는 페이지 → 연결 Instagram 계정의 확인 순서입니다. [계정 ID 확인 절차](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/get-started)

**`me/accounts`가 빈 목록일 때:** 연결 계정이 없다고 바로 단정하지 마세요. 다른 Facebook 사용자로 로그인했는지, 앱에 페이지 선택 권한을 허용했는지, Business Suite에서 해당 페이지 작업 권한이 할당돼 있는지, 사용자 토큰 대신 페이지 토큰을 사용했는지부터 확인합니다. 페이지 ID를 이미 알고 있다면 해당 페이지 조회를 시도할 수 있지만 권한을 우회할 수는 없습니다.

## 5. Aialy에서 연결하고 첫 수집

1. 사용할 워크스페이스를 선택합니다.
2. **소스 연결 → Instagram 연결**에서 토큰, 숫자 IG 계정 ID, API 버전을 입력합니다.
3. 연결 결과에 표시된 사용자 이름이 맞는지 확인합니다. 앱은 `id,username` 조회로 확인하며 응답에 토큰을 되돌려 보내지 않습니다.
4. **계정 추가**에서 게시물을 가져올 계정의 `@` 없는 사용자 이름을 등록합니다. 직접 운영하는 계정은 자사 계정으로, 다른 브랜드·크리에이터는 해당 구분으로 등록합니다.
5. **지금 수집**을 실행한 뒤 콘텐츠와 수집 결과를 확인합니다. 현재 계정당 최근 최대 100개 범위이며 전체 과거 이력을 가져오는 것은 아닙니다.
6. 자동 갱신이 필요하면 해당 계정에서 명시적으로 켭니다. 로컬 서버가 실행되는 동안에만 주기적으로 갱신됩니다.

토큰은 선택한 워크스페이스의 서버 파일에 저장됩니다. 공개 Git 저장소, 이슈, 스크린샷, 채팅에 붙이지 마세요. Aialy는 새 워크스페이스에 다른 공간의 토큰을 자동 복사하지 않습니다.

## 다른 회사·바이어 계정도 볼 수 있나요?

연결한 본인 계정의 권한을 바탕으로, 사용자 이름을 지정한 다른 공개 프로페셔널 계정의 공개 정보를 Business Discovery로 조회할 수 있습니다. 개인 계정·비공개 데이터·도달 등의 비공개 인사이트까지 열리는 것은 아닙니다. 특정 미디어 필드나 영상 URL은 제공되지 않을 수 있습니다. [Meta Business Discovery 안내](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/business-discovery)

**연결 성공은 Instagram 전체 키워드 검색이나 Meta 광고 자동 수집 성공을 뜻하지 않습니다.** Aialy의 현재 수집기는 직접 등록한 계정을 읽습니다.

## 만료·오류가 생겼을 때

| 증상 | 먼저 확인할 것 |
| --- | --- |
| 연결 실패 또는 토큰 만료 | [Meta 토큰 디버거](https://developers.facebook.com/tools/debug/accesstoken/)에서 유효성·앱·권한·만료 정보 확인 후 다시 연결 |
| 계정 ID 조회 실패 | 앱 ID나 Facebook 페이지 ID를 넣지 않았는지 확인 |
| 다른 계정 수집 실패 | 사용자 이름, 프로페셔널 계정 여부, 제한 조건, 해당 API 권한 확인 |
| 일부 지표·썸네일 없음 | 제공되지 않은 값인지 확인. 앱은 없는 지표를 0으로 만들지 않음 |
| 자동 수집이 안 됨 | 서버 실행 여부, 해당 공간 연결 상태, 수집 대상의 자동 갱신 설정 확인 |

토큰의 유효 기간은 발급 방식에 따라 다릅니다. 현재 앱에는 자동 토큰 갱신이나 OAuth 로그인 버튼이 없으므로, 만료되면 Meta에서 새 토큰을 준비해 다시 연결합니다. 장기 토큰을 운영하려면 현재 로그인 방식에 맞는 [Meta 토큰 문서](https://developers.facebook.com/docs/facebook-login/guides/access-tokens/)를 확인하세요.

## 오픈소스 설치와 서비스 운영의 차이

코드를 공개하는 것과 Meta 앱을 모든 사용자에게 제공하는 것은 별개입니다. 각 회사가 자신의 Meta 앱·자산으로 로컬 설치를 테스트하는 흐름부터 시작할 수 있습니다. 하나의 운영 서비스에 일반 사용자를 받아 각자의 계정을 연결하게 하려면, 필요한 권한의 접근 수준과 앱 검수, 해당하는 비즈니스 인증·개인정보처리방침·데이터 삭제 안내 등을 준비해야 합니다. 대시보드에서 요구하는 절차를 확인하세요. [Meta 공식 시작 안내의 다음 단계](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/get-started)

현재 Aialy는 토큰 수동 연결을 제공하는 로컬 앱입니다. 외부 고객용 Meta 로그인·앱 검수 완료 서비스로 안내하지 않습니다.
