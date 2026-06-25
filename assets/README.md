# Assets Guide

고유재 웹사이트에서 사용하는 이미지와 영상 소스 정리 기준입니다.

## Folder Map

- `images/hero/`
  - 메인 첫 화면에 쓰는 대표 이미지, 포스터 이미지
  - 예: `_0049.jpg`, `_0049_poster.webp`

- `images/gallery/`
  - 메인 갤러리와 인스타그램 fallback 이미지
  - 예: `gallery_01.jpg`, `0057.jpg`, `0073.jpg`

- `images/social/`
  - 카카오톡, 문자, SNS 공유 미리보기 전용 이미지
  - 예: `og-image.jpg`

- `video/hero/`
  - 메인 첫 화면 영상
  - 예: `_0049_mobile.mp4`, `_0049_animation.mp4`

- `raw/`
  - 원본 영상, 보정 전 소스, 임시 작업 파일
  - Vercel 배포에서는 제외됩니다.

## Naming Rule

- 갤러리 추가 사진: `gallery_02.jpg`, `gallery_03.jpg`
- 공유 대표 이미지: `og-image.jpg`
- 모바일 최적화 이미지: 가능하면 JPG 또는 WebP, 300KB-800KB 권장
- 원본 대용량 파일은 `raw/`에 보관하고 운영 페이지에는 직접 연결하지 않습니다.
