# StarSnap Bible Web

Bible 전용 계정으로 성경 본문을 검색하고 비공개 QT를 기록하는 독립 React 애플리케이션입니다.

## 경계

- API: 같은 출처의 `/api/bible/*`만 사용
- 인증: Bible 서버의 `bible-session` HttpOnly 쿠키만 사용
- 계정·세션·말씀 노트: Bible 전용 PostgreSQL에만 저장
- SNS 피드, 채팅, Google OAuth, access/refresh 토큰을 번들에 포함하지 않음

## 실행

```powershell
npm.cmd ci
npm.cmd run dev
```

로컬 Vite 프록시는 기본적으로 `http://localhost:8080`의 Bible 서버를 사용합니다. 다른 Bible 서버가 필요하면 `VITE_DEV_API_TARGET`을 설정합니다.

## 검증

```powershell
npm.cmd run build
npm.cmd audit
```

운영 Nginx는 `/api/bible/*`만 `starsnap-bible_server:8080`으로 전달하고 다른 `/api/*` 요청은 거부합니다.
