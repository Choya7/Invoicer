import sys
from PySide6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QPushButton, QLabel,
    QLineEdit, QComboBox, QRadioButton, QTabWidget, QTableWidget,
    QTableWidgetItem, QHeaderView, QGroupBox, QGridLayout, QWidget,
    QMenu, QMessageBox
)
from PySide6.QtCore import Qt
from core.database import get_all_clients, add_client, update_client

class AddEditClientDialog(QDialog):
    def __init__(self, parent=None, client_data=None):
        super().__init__(parent)
        self.setWindowTitle("매출처 추가" if not client_data else "매출처 수정")
        self.resize(300, 200)
        self.client_data = client_data
        self.init_ui()

    def init_ui(self):
        layout = QGridLayout(self)
        
        layout.addWidget(QLabel("상호(법인명):"), 0, 0)
        self.txt_name = QLineEdit()
        layout.addWidget(self.txt_name, 0, 1)

        layout.addWidget(QLabel("사업자번호:"), 1, 0)
        self.txt_biz = QLineEdit()
        layout.addWidget(self.txt_biz, 1, 1)

        layout.addWidget(QLabel("성명:"), 2, 0)
        self.txt_owner = QLineEdit()
        layout.addWidget(self.txt_owner, 2, 1)

        layout.addWidget(QLabel("메모:"), 3, 0)
        self.txt_memo = QLineEdit()
        layout.addWidget(self.txt_memo, 3, 1)
        
        if self.client_data:
            self.txt_name.setText(self.client_data.get("name", ""))
            self.txt_biz.setText(self.client_data.get("biz_no", ""))
            self.txt_owner.setText(self.client_data.get("owner", ""))
            self.txt_memo.setText(self.client_data.get("memo", ""))

        btn_layout = QHBoxLayout()
        btn_save = QPushButton("저장")
        btn_cancel = QPushButton("취소")
        btn_save.clicked.connect(self.save)
        btn_cancel.clicked.connect(self.reject)
        btn_layout.addWidget(btn_save)
        btn_layout.addWidget(btn_cancel)

        layout.addLayout(btn_layout, 4, 0, 1, 2)
        
        self.setStyleSheet("""
            QWidget { font-family: 'Malgun Gothic', sans-serif; font-size: 13px; }
            QLineEdit { border: 1px solid #aaa; padding: 4px; }
            QPushButton { padding: 5px; background: #f0f0f0; border: 1px solid #aaa; }
        """)

    def save(self):
        self.result_data = {
            "name": self.txt_name.text().strip(),
            "biz_no": self.txt_biz.text().strip(),
            "owner": self.txt_owner.text().strip(),
            "memo": self.txt_memo.text().strip()
        }
        if self.client_data:
            self.result_data["id"] = self.client_data["id"]
        
        if not self.result_data["name"]:
            QMessageBox.warning(self, "입력 오류", "상호(법인명)는 1글자 이상이어야 합니다.")
            return
            
        self.accept()

class ClientSearchDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("매출처선택")
        self.resize(480, 550)
        self.selected_client = None
        self.init_ui()

    def init_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(8, 8, 8, 8)
        
        # 1. Top Buttons
        top_layout = QHBoxLayout()
        btn_close = QPushButton("닫기")
        btn_close.clicked.connect(self.reject)
        top_layout.addWidget(btn_close)
        top_layout.addStretch()
        
        self.btn_menu = QPushButton("관련메뉴 ▼")
        menu = QMenu(self)
        act_edit = menu.addAction("매출처 수정")
        act_edit.triggered.connect(self.edit_client)
        self.btn_menu.setMenu(menu)
        
        btn_add = QPushButton("매출처 추가")
        btn_add.clicked.connect(self.add_client)
        top_layout.addWidget(self.btn_menu)
        top_layout.addWidget(btn_add)
        layout.addLayout(top_layout)
        
        # 2. Search Area
        search_group = QGroupBox()
        search_group.setStyleSheet("QGroupBox { border: 1px solid #777; margin-top: 0px; }")
        search_layout = QGridLayout()
        search_layout.setContentsMargins(5, 5, 5, 5)
        
        lbl_search = QLabel("찾\n기")
        lbl_search.setStyleSheet("background-color: #eee; padding: 5px;")
        search_layout.addWidget(lbl_search, 0, 0, 2, 1, Qt.AlignCenter)
        
        combo_search = QComboBox()
        combo_search.addItems(["상호(법인명)", "사업자번호", "대표자명"])
        search_layout.addWidget(combo_search, 0, 1)
        
        txt_search = QLineEdit()
        search_layout.addWidget(txt_search, 0, 2)
        
        btn_search = QPushButton("🔍")
        btn_search.setStyleSheet("padding: 5px;")
        search_layout.addWidget(btn_search, 0, 3)
        
        # Radio buttons for search type
        radio_layout = QHBoxLayout()
        radio_start = QRadioButton("~로 시작")
        radio_include = QRadioButton("~를 포함")
        radio_include.setChecked(True)
        radio_layout.addStretch()
        radio_layout.addWidget(radio_start)
        radio_layout.addWidget(radio_include)
        radio_layout.addStretch()
        search_layout.addLayout(radio_layout, 1, 1, 1, 3, Qt.AlignCenter)
        
        search_group.setLayout(search_layout)
        layout.addWidget(search_group)
        
        # 3. Sort Area
        sort_group = QGroupBox()
        sort_group.setStyleSheet("QGroupBox { border: 1px solid #777; margin-top: 0px; }")
        sort_layout = QHBoxLayout()
        sort_layout.setContentsMargins(5, 5, 5, 5)
        
        lbl_sort = QLabel("정렬")
        lbl_sort.setStyleSheet("background-color: #eee; padding: 5px;")
        sort_layout.addWidget(lbl_sort)
        sort_layout.addStretch()
        
        sort_biz = QRadioButton("사업자번호순")
        sort_name = QRadioButton("상호순")
        sort_name.setChecked(True)
        sort_layout.addWidget(sort_biz)
        sort_layout.addWidget(sort_name)
        sort_layout.addStretch()
        
        sort_group.setLayout(sort_layout)
        layout.addWidget(sort_group)
        
        # 4. Tabs
        self.tabs = QTabWidget()
        self.tabs.addTab(QWidget(), "회사")
        self.tabs.addTab(QWidget(), "개인")
        self.tabs.addTab(QWidget(), "기타")
        self.tabs.addTab(QWidget(), "찾기결과")
        
        layout.addWidget(self.tabs)
        
        # Table
        self.table = QTableWidget(0, 5)
        self.table.setHorizontalHeaderLabels(["ID", "상호", "사업자번호", "성명", "메모"])
        self.table.setColumnHidden(0, True)
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.Interactive)
        self.table.horizontalHeader().setStretchLastSection(True)
        self.table.setColumnWidth(1, 150)
        self.table.setColumnWidth(2, 120)
        self.table.setColumnWidth(3, 80)
        self.table.setSelectionBehavior(QTableWidget.SelectRows)
        self.table.setEditTriggers(QTableWidget.NoEditTriggers)
        
        self.table.itemDoubleClicked.connect(self.on_item_double_clicked)
        
        layout.addWidget(self.table)
        
        # 5. Status bar
        self.status_lbl = QLabel()
        self.status_lbl.setAlignment(Qt.AlignRight)
        layout.addWidget(self.status_lbl)
        
        self.load_data()
        
        # Apply CSS
        self.setStyleSheet("""
            QDialog { background-color: #ffffff; }
            QWidget { font-family: 'Malgun Gothic', sans-serif; font-size: 13px; color: #111; }
            QTableWidget { selection-background-color: #b3d4fc; selection-color: black; gridline-color: #aaa; }
            QHeaderView::section { background-color: #e3ebf3; font-weight: bold; border: 1px solid #aaa; padding: 4px; }
            QPushButton { padding: 4px 10px; background-color: #f0f0f0; border: 1px solid #aaa; border-radius: 2px; }
            QPushButton:hover { background-color: #e2e6ea; }
            QPushButton:pressed { background-color: #c8d0d6; border: 1px inset #888888; }
            QLineEdit, QComboBox { border: 1px solid #aaa; background-color: #fff; padding: 3px; }
            QMenu { background-color: white; border: 1px solid #aaa; }
            QMenu::item { padding: 4px 20px; }
            QMenu::item:selected { background-color: #b3d4fc; }
        """)
        
    def load_data(self):
        clients = get_all_clients()
        self.table.setRowCount(0)
        for i, c in enumerate(clients):
            self.table.insertRow(i)
            self.table.setItem(i, 0, QTableWidgetItem(str(c["id"])))
            self.table.setItem(i, 1, QTableWidgetItem(c["name"]))
            self.table.setItem(i, 2, QTableWidgetItem(c["biz_no"]))
            self.table.setItem(i, 3, QTableWidgetItem(c["owner"]))
            self.table.setItem(i, 4, QTableWidgetItem(c["memo"]))
        self.status_lbl.setText(f"{len(clients)}개의 자료가 있습니다.")
        
    def add_client(self):
        dlg = AddEditClientDialog(self)
        if dlg.exec():
            d = dlg.result_data
            add_client(d["name"], d["biz_no"], d["owner"], d["memo"])
            self.load_data()
            
    def edit_client(self):
        curr = self.table.currentRow()
        if curr < 0:
            QMessageBox.warning(self, "선택 오류", "수정할 업체를 먼저 클릭하여 선택해주세요.")
            return
            
        c_id = int(self.table.item(curr, 0).text())
        c_data = {
            "id": c_id,
            "name": self.table.item(curr, 1).text() if self.table.item(curr, 1) else "",
            "biz_no": self.table.item(curr, 2).text() if self.table.item(curr, 2) else "",
            "owner": self.table.item(curr, 3).text() if self.table.item(curr, 3) else "",
            "memo": self.table.item(curr, 4).text() if self.table.item(curr, 4) else "",
        }
        dlg = AddEditClientDialog(self, client_data=c_data)
        if dlg.exec():
            d = dlg.result_data
            update_client(d["id"], d["name"], d["biz_no"], d["owner"], d["memo"])
            self.load_data()

    def on_item_double_clicked(self, item):
        row = item.row()
        client_name = self.table.item(row, 1).text()
        self.selected_client = client_name
        self.accept()
