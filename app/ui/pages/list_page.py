from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QPushButton, QLabel,
    QTableWidget, QTableWidgetItem, QHeaderView, QSplitter,
    QTabWidget, QLineEdit, QComboBox, QRadioButton, QCheckBox,
    QDateEdit, QGridLayout, QFrame
)
from PySide6.QtCore import Qt, QDate
from core.database import get_all_invoices, get_all_clients

class ListPage(QWidget):
    def __init__(self):
        super().__init__()
        self.init_ui()
        
    def init_ui(self):
        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(5, 5, 5, 5)
        main_layout.setSpacing(5)
        
        # 1. Top Global Toolbar
        top_bar = QHBoxLayout()
        btns = ["출력보관함", "인쇄", "목록저장", "닫기"]
        for b in btns:
            btn = QPushButton(b)
            top_bar.addWidget(btn)
        top_bar.addStretch()
        top_bar.addWidget(QPushButton("관련메뉴 ▼"))
        main_layout.addLayout(top_bar)
        
        # 2. Tabs
        self.type_tabs = QTabWidget()
        self.tab_period = QWidget()
        self.tab_client = QWidget()
        
        self.type_tabs.addTab(self.tab_period, "기간으로 조회")
        self.type_tabs.addTab(self.tab_client, "매출처별 조회")
        self.type_tabs.setCurrentIndex(1) # Default to Client view as per image
        
        self.build_period_tab()
        self.build_client_tab()
        
        self.type_tabs.currentChanged.connect(self.on_tab_changed)
        main_layout.addWidget(self.type_tabs)
        
        self.setStyleSheet("""
            QWidget { font-family: 'Malgun Gothic', sans-serif; font-size: 13px; color: #111; }
            QTabWidget::pane { border: 1px solid #aaa; background: #fff; }
            QTabBar::tab { background: #eee; border: 1px solid #aaa; padding: 5px 15px; margin-right: 2px; }
            QTabBar::tab:selected { background: #fff; border-bottom-color: #fff; font-weight: bold; }
            
            QTableWidget { gridline-color: #aaa; selection-background-color: #b3d4fc; selection-color: black; background: #fff; }
            QHeaderView::section { background-color: #e3ebf3; font-weight: bold; border: 1px solid #aaa; padding: 4px; }
            QPushButton { padding: 4px 10px; background-color: #f8f9fa; border: 1px solid #ccc; font-weight: bold; }
            QPushButton:hover { background-color: #e2e6ea; }
            QPushButton:pressed { background-color: #c8d0d6; border: 1px inset #888888; }
            QSplitter::handle { background-color: #cccccc; width: 4px; }
        """)

    def build_period_tab(self):
        layout = QVBoxLayout(self.tab_period)
        layout.setContentsMargins(10, 10, 10, 10)
        
        r_mid = QHBoxLayout()
        r_mid.addWidget(QLabel("조회 기간:"))
        self.p_date_from = QDateEdit(QDate.currentDate().addDays(-30))
        self.p_date_from.setCalendarPopup(True)
        r_mid.addWidget(self.p_date_from)
        r_mid.addWidget(QLabel("~"))
        self.p_date_to = QDateEdit(QDate.currentDate())
        self.p_date_to.setCalendarPopup(True)
        r_mid.addWidget(self.p_date_to)
        
        btn_today = QPushButton("오늘날짜")
        btn_search = QPushButton("조회하기")
        btn_search.setStyleSheet("color: blue; padding-left: 20px; padding-right: 20px;")
        btn_today.clicked.connect(lambda: self.p_date_from.setDate(QDate.currentDate()))
        btn_search.clicked.connect(self.reload_period_invoices)
        r_mid.addWidget(btn_today)
        r_mid.addWidget(btn_search)
        
        r_mid.addStretch()
        self.p_chk_reverse = QCheckBox("최신순 정렬(역순)")
        self.p_chk_reverse.setChecked(True)
        r_mid.addWidget(self.p_chk_reverse)
        layout.addLayout(r_mid)
        
        r_bot = QHBoxLayout()
        r_bot.addStretch()
        btn_print = QPushButton("선택 항목 인쇄")
        btn_del = QPushButton("선택 삭제")
        r_bot.addWidget(btn_print)
        r_bot.addWidget(btn_del)
        layout.addLayout(r_bot)
        
        self.p_inv_table = QTableWidget(0, 9)
        self.p_inv_table.setHorizontalHeaderLabels([
            "발행일자", "거래처", "품목", "합계금액", "공급가액", "세액", "작성일자", "발행방법", "선택"
        ])
        self.p_inv_table.horizontalHeader().setStretchLastSection(True)
        self.p_inv_table.setSelectionBehavior(QTableWidget.SelectRows)
        layout.addWidget(self.p_inv_table)
        
        self.p_sum_lbl = QLabel("선택 기간 총 합계금액 : 0 원")
        self.p_sum_lbl.setStyleSheet("background-color: #eef; border: 1px solid #aaa; padding: 5px; font-weight: bold; font-size: 14px;")
        self.p_sum_lbl.setAlignment(Qt.AlignCenter)
        layout.addWidget(self.p_sum_lbl)

    def build_client_tab(self):
        layout = QVBoxLayout(self.tab_client)
        layout.setContentsMargins(5, 5, 5, 5)
        
        splitter = QSplitter(Qt.Horizontal)
        
        # --- Left Panel ---
        left_w = QWidget()
        left_l = QVBoxLayout(left_w)
        left_l.setContentsMargins(0, 0, 0, 0)
        
        # Search area
        search_l = QGridLayout()
        search_l.addWidget(QLabel("찾기"), 0, 0)
        cbo = QComboBox()
        cbo.addItem("상호(성명)")
        search_l.addWidget(cbo, 0, 1)
        search_l.addWidget(QLineEdit(), 0, 2)
        
        rd_l = QHBoxLayout()
        rd1 = QRadioButton("~로 시작 🔍")
        rd2 = QRadioButton("~을 포함 🔍")
        rd2.setChecked(True)
        rd_l.addWidget(rd1)
        rd_l.addWidget(rd2)
        search_l.addLayout(rd_l, 1, 0, 1, 3)
        left_l.addLayout(search_l)
        
        # Client Tabs
        ctab = QTabWidget()
        ctab.addTab(QWidget(), "회사")
        ctab.addTab(QWidget(), "개인")
        ctab.addTab(QWidget(), "기타")
        ctab.addTab(QWidget(), "찾기결과")
        left_l.addWidget(ctab)
        
        self.client_table = QTableWidget(0, 2)
        self.client_table.setHorizontalHeaderLabels(["상호", "사업자등록번호"])
        self.client_table.horizontalHeader().setStretchLastSection(True)
        self.client_table.setColumnWidth(0, 120)
        self.client_table.setSelectionBehavior(QTableWidget.SelectRows)
        self.client_table.setEditTriggers(QTableWidget.NoEditTriggers)
        self.client_table.itemSelectionChanged.connect(self.on_client_selected)
        left_l.addWidget(self.client_table)
        
        self.client_count_lbl = QLabel("")
        self.client_count_lbl.setAlignment(Qt.AlignRight)
        left_l.addWidget(self.client_count_lbl)
        
        # --- Right Panel ---
        right_w = QWidget()
        right_l = QVBoxLayout(right_w)
        right_l.setContentsMargins(0, 0, 0, 0)
        
        # Top filters
        r_top = QHBoxLayout()
        self.lbl_selected_client = QLabel("거래처명 : ")
        self.lbl_selected_client.setStyleSheet("font-weight: bold; font-size: 15px;")
        r_top.addWidget(self.lbl_selected_client)
        r_top.addStretch()
        self.chk_reverse = QCheckBox("역순보기")
        self.chk_reverse.setChecked(True)
        r_top.addWidget(self.chk_reverse)
        right_l.addLayout(r_top)
        
        # Date & Action row
        r_mid = QHBoxLayout()
        r_mid.addWidget(QLabel("기간"))
        self.date_from = QDateEdit(QDate.currentDate().addDays(-30))
        self.date_from.setCalendarPopup(True)
        r_mid.addWidget(self.date_from)
        r_mid.addWidget(QLabel("~"))
        self.date_to = QDateEdit(QDate.currentDate())
        self.date_to.setCalendarPopup(True)
        r_mid.addWidget(self.date_to)
        
        btn_today = QPushButton("오늘날짜")
        btn_search = QPushButton("조회")
        btn_search.setStyleSheet("color: blue;")
        btn_today.clicked.connect(lambda: self.date_from.setDate(QDate.currentDate()))
        btn_search.clicked.connect(self.reload_invoices)
        r_mid.addWidget(btn_today)
        r_mid.addWidget(btn_search)
        
        r_mid.addSpacing(15)
        rd_grp = QFrame()
        rd_grp.setStyleSheet("QFrame { border: 1px solid #aaa; padding: 2px; }")
        rg_l = QHBoxLayout(rd_grp)
        rg_l.setContentsMargins(5, 0, 5, 0)
        rd_issue = QRadioButton("발행일자")
        rd_write = QRadioButton("작성일자")
        rd_issue.setChecked(True)
        rg_l.addWidget(rd_issue)
        rg_l.addWidget(rd_write)
        r_mid.addWidget(rd_grp)
        
        r_mid.addStretch()
        right_l.addLayout(r_mid)
        
        r_bot = QHBoxLayout()
        r_bot.addStretch()
        r_bot.addWidget(QPushButton("계산서/세금 일괄변환"))
        r_bot.addWidget(QPushButton("삭제"))
        self.chk_all = QCheckBox("전체선택")
        r_bot.addWidget(self.chk_all)
        right_l.addLayout(r_bot)
        
        # Invoice Table
        self.inv_table = QTableWidget(0, 9)
        self.inv_table.setHorizontalHeaderLabels([
            "발행일자", "품목", "합계금액", "공급가액", "세액", "작성일자", "발행방법", "선택", "상태"
        ])
        self.inv_table.horizontalHeader().setStretchLastSection(True)
        self.inv_table.setSelectionBehavior(QTableWidget.SelectRows)
        right_l.addWidget(self.inv_table)
        
        # Bottom Summary
        self.sum_lbl = QLabel("해당 업체 합계금액 :   0 원")
        self.sum_lbl.setStyleSheet("background-color: #f8f9fa; border: 1px solid #aaa; padding: 5px; font-weight: bold; font-size: 14px;")
        self.sum_lbl.setAlignment(Qt.AlignCenter)
        right_l.addWidget(self.sum_lbl)
        
        splitter.addWidget(left_w)
        splitter.addWidget(right_w)
        splitter.setSizes([250, 750]) # Ratio mimicking image
        layout.addWidget(splitter)

    def showEvent(self, event):
        super().showEvent(event)
        self.load_clients()
        # Default initialization triggers
        if self.type_tabs.currentIndex() == 0:
            self.reload_period_invoices()
        else:
            self.reload_invoices()

    def on_tab_changed(self, index):
        if index == 0:
            self.reload_period_invoices()
        elif index == 1:
            self.reload_invoices()

    def load_clients(self):
        clients = get_all_clients()
        self.client_table.blockSignals(True)
        self.client_table.setRowCount(0)
        for i, c in enumerate(clients):
            self.client_table.insertRow(i)
            self.client_table.setItem(i, 0, QTableWidgetItem(c["name"]))
            self.client_table.setItem(i, 1, QTableWidgetItem(c["biz_no"]))
        self.client_count_lbl.setText(f"{len(clients)}건")
        self.client_table.blockSignals(False)

    def on_client_selected(self):
        items = self.client_table.selectedItems()
        if items:
            name = self.client_table.item(items[0].row(), 0).text()
            self.lbl_selected_client.setText(f"거래처명 :    {name}")
            self.reload_invoices(client_filter=name)

    def reload_invoices(self, client_filter=None):
        invoices = get_all_invoices()
        self.inv_table.setRowCount(0)
        
        if client_filter is False or client_filter is None:
            label_text = self.lbl_selected_client.text()
            if " :    " in label_text:
                client_filter = label_text.split(" :    ")[1]

        filtered = []
        for inv in invoices:
            if client_filter and inv["client_name"] != client_filter:
                continue
            
            inv_d = QDate.fromString(inv["issue_date"], "yyyy-MM-dd")
            if inv_d >= self.date_from.date() and inv_d <= self.date_to.date():
                filtered.append(inv)
                
        if not self.chk_reverse.isChecked():
            filtered.reverse()
            
        total_sum = 0
        self._populate_invoice_table(self.inv_table, filtered, True)
        
        for inv in filtered:
            items = inv["data"].get("items", [])
            valid_items = [it for it in items if str(it.get('qty','')).strip()]
            s = sum([int(str(it.get('supply', 0)).replace(',','')) for it in valid_items])
            t = sum([int(str(it.get('tax', 0)).replace(',','')) for it in valid_items])
            total_sum += (s+t)
            
        self.sum_lbl.setText(f"해당 업체 합계금액 :   {total_sum:,} 원")

    def reload_period_invoices(self):
        invoices = get_all_invoices()
        self.p_inv_table.setRowCount(0)
        
        filtered = []
        for inv in invoices:
            inv_d = QDate.fromString(inv["issue_date"], "yyyy-MM-dd")
            if inv_d >= self.p_date_from.date() and inv_d <= self.p_date_to.date():
                filtered.append(inv)
                
        if not self.p_chk_reverse.isChecked():
            filtered.reverse()
            
        total_sum = 0
        self._populate_invoice_table(self.p_inv_table, filtered, False)
        
        for inv in filtered:
            items = inv["data"].get("items", [])
            valid_items = [it for it in items if str(it.get('qty','')).strip()]
            s = sum([int(str(it.get('supply', 0)).replace(',','')) for it in valid_items])
            t = sum([int(str(it.get('tax', 0)).replace(',','')) for it in valid_items])
            total_sum += (s+t)
            
        self.p_sum_lbl.setText(f"선택 기간 총 합계금액 :   {total_sum:,} 원")
        
    def _populate_invoice_table(self, table_widget, filtered_data, is_client_tab):
        for i, inv in enumerate(filtered_data):
            table_widget.insertRow(i)
            
            date_item = QTableWidgetItem(inv["issue_date"])
            date_item.setTextAlignment(Qt.AlignCenter)
            table_widget.setItem(i, 0, date_item)
            
            offset = 0
            if not is_client_tab:
                c_item = QTableWidgetItem(inv["client_name"])
                c_item.setTextAlignment(Qt.AlignCenter)
                table_widget.setItem(i, 1, c_item)
                offset = 1
            
            items = inv["data"].get("items", [])
            valid_items = [it for it in items if str(it.get('qty','')).strip()]
            item_desc = f"{valid_items[0].get('name','품목')} 외 {len(valid_items)-1}건" if len(valid_items) > 1 else (valid_items[0].get('name','품목') if len(valid_items) == 1 else "")
            table_widget.setItem(i, 1 + offset, QTableWidgetItem(item_desc))
            
            s = sum([int(str(it.get('supply', 0)).replace(',','')) for it in valid_items])
            t = sum([int(str(it.get('tax', 0)).replace(',','')) for it in valid_items])
            
            for j, val in enumerate([s+t, s, t]):
                w = QTableWidgetItem(f"{val:,}")
                w.setTextAlignment(Qt.AlignRight | Qt.AlignVCenter)
                table_widget.setItem(i, 2 + offset + j, w)
            
            d2_item = QTableWidgetItem(inv["issue_date"])
            d2_item.setTextAlignment(Qt.AlignCenter)
            table_widget.setItem(i, 5 + offset, d2_item)
            
            m_item = QTableWidgetItem("종이")
            m_item.setTextAlignment(Qt.AlignCenter)
            table_widget.setItem(i, 6 + offset, m_item)
            
            chk_w = QWidget()
            chk_l = QHBoxLayout(chk_w)
            chk_l.setContentsMargins(0,0,0,0)
            chk = QCheckBox()
            chk_l.addWidget(chk, alignment=Qt.AlignCenter)
            table_widget.setCellWidget(i, 7 + offset, chk_w)
            
            if is_client_tab:
                s_item = QTableWidgetItem("저장(O)")
                s_item.setTextAlignment(Qt.AlignCenter)
                s_item.setForeground(Qt.blue)
                table_widget.setItem(i, 8 + offset, s_item)