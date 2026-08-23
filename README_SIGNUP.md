# SignUp feature - 구현 안내

이 문서는 SignUp 컴포넌트 및 관련 훅/서비스 사용법을 빠르게 설명합니다.

설치(권장 추가 패키지)

```bash
npm install --save react-hook-form zod @hookform/resolvers axios classnames react-icons
npm install --save-dev @testing-library/react @testing-library/jest-dom jest cypress
```

파일 위치
- `src/pages/auth/SignupPage.tsx` - 폼과 폼 로직
- `src/components/*` - FormField, PasswordField, CheckboxWithLink, LoadingButton 등
- `src/hooks/useEmailCheck.ts` - 이메일 중복 체크(debounce)
- `src/hooks/useSignUp.ts` - 회원가입 전송 래퍼
- `src/services/api.ts` - axios client 및 API 함수

환경변수
- `.env` 또는 환경 설정에 `VITE_API_BASE_URL` 을 설정합니다. 브라우저가 같은 출처의 Nginx/Vite 프록시를 사용할 때는 비워 둘 수 있습니다.

검증
- 프로덕션 빌드: `npm run build`
- 디자인 토큰 검사: `npm run design:check`
- E2E: `npm run cypress:open`

주의
- 현재 일부 패키지(예: react-hook-form, zod)는 기본 의존성에 포함되어 있지 않습니다. 상단 설치 명령을 실행하세요.
