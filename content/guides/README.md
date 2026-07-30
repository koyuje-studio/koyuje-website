# 촬영 가이드 콘텐츠 구조

새 검색 콘텐츠는 지역명만 바꾼 복제 문서가 아니라 실제 촬영 경험과 운영 정보를 담습니다.

필수 필드:

- `title`
- `description`
- `slug`
- `publishedAt`
- `updatedAt`
- `author`
- `category`
- `coverImage`
- `coverImageAlt`
- `body`
- `relatedProducts`
- `faq`
- `canonical`

발행 시 지킬 사항:

1. 화면에 실제 게시일과 수정일을 표시합니다.
2. 본문은 정적 HTML에 포함하고 일반 링크로 접근할 수 있게 합니다.
3. `Article` 또는 `BlogPosting`, `BreadcrumbList` JSON-LD를 추가합니다.
4. 아기 실명 등 개인정보를 제목, 이미지 파일명, 대체텍스트에 사용하지 않습니다.
5. 운영자가 직접 확인한 촬영 경험과 사진만 사용합니다.
