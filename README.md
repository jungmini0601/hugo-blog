# hugo-blog

Notion으로 글을 쓰고 Hugo + Tailwind v4로 빌드해 GitHub Pages에 배포하는 개인 기술 블로그.

- **콘텐츠**: Notion DB(`Blog Posts`)의 `Status = Published` 글
- **동기화**: Go CLI(`tools/notion-sync`)가 Notion → Hugo 콘텐츠로 변환(이미지 로컬 저장 포함)
- **빌드**: Hugo(테마 없음) + Tailwind v4 (`css.TailwindCSS`)
- **배포**: GitHub Actions `workflow_dispatch` → sync → build → GitHub Pages

확정된 설계·의도는 [docs/intent/hugo-notion-blog.md](docs/intent/hugo-notion-blog.md) 참고.

## 사전 준비

1. Notion Integration 생성 → API 토큰 발급
2. `Blog Posts` 데이터베이스를 해당 integration에 Connect
3. GitHub Actions Secret `NOTION_TOKEN` 등록
4. Repo Settings → Pages → Source = **GitHub Actions**

## 로컬 개발

```bash
# 의존성 설치 (Tailwind CLI)
npm install

# Notion 동기화 (NOTION_TOKEN 필요)
NOTION_TOKEN=secret_xxx go run ./tools/notion-sync

# 로컬 서버
hugo server
```

## 배포

GitHub 저장소 → Actions → **Deploy** 워크플로 → `Run workflow` (workflow_dispatch)
