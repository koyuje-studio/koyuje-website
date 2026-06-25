# Assets Guide

고유재 웹사이트에서 사용하는 이미지와 영상 소스 정리 기준입니다.

## Folder Map

- `images/hero/`
  - 첫 화면에 사용하는 대표 이미지와 포스터 이미지
  - 예: `_0049.jpg`, `_0049_poster.webp`

- `images/gallery/`
  - 갤러리 원본 JPG 이미지
  - 예: `gallery_01.jpg`, `0057.jpg`, `0073.jpg`

- `images/gallery/webp/`
  - 실제 웹사이트에 우선 사용하는 모바일 최적화 WebP 이미지
  - 같은 사진은 JPG와 WebP 파일명을 맞춰 관리합니다.

- `images/social/`
  - 카카오톡, 문자, SNS 공유 미리보기용 이미지
  - 예: `og-image.jpg`

- `video/hero/`
  - 첫 화면에 사용하는 최적화 영상
  - 예: `_0049_mobile.mp4`, `_0049_desktop.webm`, `_0049_animation.mp4`

- `raw/`
  - 원본 영상, 보정 전 소스, 임시 작업 파일
  - Vercel 배포에서는 제외됩니다.
  - 운영 페이지에서 직접 연결하지 않습니다.

## Naming Rule

- 갤러리 추가 사진: `gallery_02.jpg`, `gallery_03.jpg`
- 최적화 WebP: 원본과 같은 이름으로 `images/gallery/webp/`에 저장
- 공유 대표 이미지: `og-image.jpg`
- 모바일 최적화 이미지는 가능하면 WebP, 300KB-800KB 권장
- 원본 대용량 파일은 `raw/`에 보관하고, 사이트에는 최적화 파일만 연결합니다.

## Export Guide

- 긴 쪽 기준 1600px-2000px 정도로 내보내면 모바일과 데스크톱 모두 안정적입니다.
- JPG는 품질 70-82, WebP는 품질 65-80부터 확인합니다.
- 얼굴 디테일이 중요한 대표 이미지는 용량보다 선명도를 우선합니다.
- 파일명은 한글, 공백, 괄호를 피하고 소문자 영문, 숫자, 언더바를 사용합니다.
