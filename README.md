# 🧾 거래명세서 관리 프로그램 (Invoicer)

이 프로그램은 **React (프론트엔드)**와 **Node.js + Prisma + SQLite (백엔드)**로 구성된 통합 관리 시스템입니다. 모든 데이터는 브라우저가 아닌 로컬 DB 파일(`backend/dev.db`)에 안전하게 저장되어 데이터의 영속성과 보안을 보장합니다.

---

## 🚀 빠른 실행 방법 (Windows)

가장 쉬운 방법은 루트 폴더에 있는 실행 파일을 사용하는 것입니다.

1.  **`start_servers.bat`** 파일을 더블 클릭합니다.
2.  백엔드 서버(포트 5000)와 프론트엔드 서버(포트 5173)가 자동으로 각각의 창에서 실행됩니다.
3.  브라우저에서 `http://localhost:5173`으로 접속합니다.

---

## 🏃‍♂️ 수동 실행 방법 (명령어)

터미널을 2개 열어서 각각 다음 명령어를 입력하세요.

### 1. 백엔드 (Backend)
```powershell
cd backend
node index.js
```

### 2. 프론트엔드 (Frontend)
```powershell
cd html
npm run dev
```

---

## 📱 모바일 접속 방법
같은 와이파이(공유기)를 사용하는 스마트폰에서 접속할 수 있습니다.

1.  PC의 **IP 주소**를 확인합니다. (명령프롬프트에서 `ipconfig` 입력)
2.  스마트폰 브라우저 주소창에 `http://[PC의 IP주소]:5173`을 입력합니다.
    *   예: `http://192.168.0.15:5173`
3.  이제 현장에서 바로 명세서를 작성하고 관리할 수 있습니다!

---

## ✨ 주요 기능 (Key Features)

### 1. 전용 데이터베이스 연동
- **Prisma ORM & SQLite**: 로컬 파일 기반의 경량 DB를 사용하여 복잡한 설치 없이도 확실한 데이터 저장 및 조회를 지원합니다.
- **고유 코드 관리**: 발행 날짜+거래처명+난수 조합의 고유 ID를 통해 데이터 중복을 방지합니다.

### 2. 모바일 최적화 반응형 UI
- **스택형 레이아웃**: 스마트폰에서는 가로로 긴 테이블이 자동으로 **카드 형태**로 전환되어 가독성을 극대화합니다.
- **슬라이딩 사이드바**: 화면을 가리지 않는 햄버거 메뉴를 통해 좁은 화면에서도 쾌적한 작업이 가능합니다.

### 3. 매출처 및 품목 마스터 관리
- 자주 거래하는 **매출처(Client)**와 **물품(Item)** 정보를 DB에 등록해두고 검색 및 자동 완성 기능을 통해 빠르게 명세표를 작성합니다.

### 4. 엑셀 출력 및 데이터 추출
- 작성된 명세표를 전문적인 엑셀 양식으로 변환하여 저장하거나 인쇄할 수 있습니다 (상세/요약 모드 지원).

---

## 🛠 기술 스택 (Tech Stack)

### Frontend
- **Framework**: React 19 (Vite)
- **Icons**: Lucide React
- **UI Interaction**: SweetAlert2 (MySwal)
- **Components**: React Datepicker, Custom CSS Design System

### Backend
- **Server**: Node.js (Express)
- **ORM**: Prisma
- **Standard**: REST API (json)

### Database
- **Storage**: SQLite 3 (Database File: `backend/dev.db`)

---

## 📂 주요 폴더 구조
- `html/`: 프론트엔드 소스 코드 (React Components, Core Logic)
- `backend/`: 백엔드 서버 소스 코드 (Express API, Prisma Schema)
- `backend/prisma/`: 데이터베이스 모델링 및 설정
- `backend/dev.db`: 실제 모든 데이터가 보관되는 DB 파일

---

## 💡 참고 사항
- **Node.js**가 설치된 환경에서만 정상 작동합니다.
- 서버 가동 중에는 터미널 창(또는 배치 파일을 통해 열린 창)을 닫지 말아주세요.
