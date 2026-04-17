import sys
from PySide6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QPushButton, QLabel,
    QLineEdit, QComboBox, QRadioButton, QTabWidget, QTableWidget,
    QTableWidgetItem, QHeaderView, QGroupBox, QGridLayout, QWidget,
    QMenu, QMessageBox
)
from PySide6.QtCore import Qt
from core.database import get_all_items, add_item, update_item

class AddEditItemDialog(QDialog):
    def __init__(self, parent=None, item_data=None):
        super().__init__(parent)
        self.setWindowTitle("물품목록 추가" if not item_data else "물품목록 수정")
        self.resize(300, 250)
        self.item_data = item_data
        self.init_ui()

    def init_ui(self):
        layout = QGridLayout(self)
        
        layout.addWidget(QLabel("물품코드:"), 0, 0)
        self.txt_code = QLineEdit()
        layout.addWidget(self.txt_code, 0, 1)

        layout.addWidget(QLabel("물품명:"), 1, 0)
        self.txt_name = QLineEdit()
        layout.addWidget(self.txt_name, 1, 1)

        layout.addWidget(QLabel("규격:"), 2, 0)
        self.txt_spec = QLineEdit()
        layout.addWidget(self.txt_spec, 2, 1)

        layout.addWidget(QLabel("판매가격:"), 3, 0)
        self.txt_price = QLineEdit()
        layout.addWidget(self.txt_price, 3, 1)
        
        if self.item_data:
            self.txt_code.setText(self.item_data.get("code", ""))
            self.txt_name.setText(self.item_data.get("name", ""))
            self.txt_spec.setText(self.item_data.get("spec", ""))
            self.txt_price.setText(str(self.item_data.get("price", "0")))

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
        try:
            p_val = self.txt_price.text().strip().replace(',', '')
            price_val = int(p_val) if p_val else 0
        except ValueError:
            QMessageBox.warning(self, "오류", "판매가격은 숫자만 입력해야 합니다.")
            return

        self.result_data = {
            "code": self.txt_code.text().strip(),
            "name": self.txt_name.text().strip(),
            "spec": self.txt_spec.text().strip(),
            "price": price_val
        }
        if self.item_data:
            self.result_data["id"] = self.item_data["id"]
        
        if not self.result_data["name"]:
            QMessageBox.warning(self, "입력 오류", "물품명은 빈 칸을 사용할 수 없습니다.")
            return
            
        self.accept()

class ItemSearchDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("물품선택")
        self.resize(480, 550)
        self.selected_item = None
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
        act_edit = menu.addAction("물품 수정")
        act_edit.triggered.connect(self.edit_item)
        self.btn_menu.setMenu(menu)
        
        btn_add = QPushButton("물품목록 추가")
        btn_add.clicked.connect(self.add_item)
        top_layout.addWidget(self.btn_menu)
        top_layout.addWidget(btn_add)
        layout.addLayout(top_layout)
        
        # 2. Search Area
        search_group = QGroupBox()
        search_group.setStyleSheet("QGroupBox { border: 1px solid #777; margin-top: 0px; }")
        search_layout = QGridLayout()
        search_layout.setContentsMargins(5, 5, 5, 5)
        
        lbl_search = QLabel("찾기")
        lbl_search.setStyleSheet("background-color: #eee; padding: 5px;")
        search_layout.addWidget(lbl_search, 0, 0, 2, 1, Qt.AlignCenter)
        
        lbl_kind = QLabel("물품명")
        search_layout.addWidget(lbl_kind, 0, 1)
        
        txt_search = QLineEdit()
        search_layout.addWidget(txt_search, 0, 2, 1, 2)
        
        # Radios
        radio_layout = QHBoxLayout()
        rd1 = QRadioButton("~로 시작 🔍")
        rd2 = QRadioButton("~을 포함 🔍")
        rd2.setChecked(True)
        radio_layout.addStretch()
        radio_layout.addWidget(rd1)
        radio_layout.addWidget(rd2)
        radio_layout.addStretch()
        search_layout.addLayout(radio_layout, 1, 1, 1, 3, Qt.AlignCenter)
        
        search_group.setLayout(search_layout)
        layout.addWidget(search_group)
        
        # 3. Sort Area
        sort_group = QGroupBox()
        sort_group.setStyleSheet("QGroupBox { border: 1px solid #777; margin-top: 0px; }")
        sort_layout = QHBoxLayout()
        sort_layout.setContentsMargins(5, 5, 5, 5)
        
        lbl_sort = QLabel("정렬순서")
        lbl_sort.setStyleSheet("background-color: #eee; padding: 5px;")
        sort_layout.addWidget(lbl_sort)
        sort_layout.addStretch()
        
        sort_code = QRadioButton("물품코드순")
        sort_name = QRadioButton("물품명순")
        sort_name.setChecked(True)
        sort_layout.addWidget(sort_code)
        sort_layout.addWidget(sort_name)
        sort_layout.addStretch()
        
        sort_group.setLayout(sort_layout)
        layout.addWidget(sort_group)
        
        # 4. Tabs
        self.tabs = QTabWidget()
        self.tabs.addTab(QWidget(), "물품목록")
        self.tabs.addTab(QWidget(), "찾기결과")
        
        layout.addWidget(self.tabs)
        
        # Table
        self.table = QTableWidget(0, 5)
        self.table.setHorizontalHeaderLabels(["ID", "물품코드", "물품명", "규격", "판매가격"])
        self.table.setColumnHidden(0, True)
        self.table.horizontalHeader().setStretchLastSection(True)
        self.table.setColumnWidth(1, 100)
        self.table.setColumnWidth(2, 160)
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
        items = get_all_items()
        self.table.setRowCount(0)
        for i, it in enumerate(items):
            self.table.insertRow(i)
            self.table.setItem(i, 0, QTableWidgetItem(str(it["id"])))
            self.table.setItem(i, 1, QTableWidgetItem(it["code"]))
            self.table.setItem(i, 2, QTableWidgetItem(it["name"]))
            self.table.setItem(i, 3, QTableWidgetItem(it["spec"]))
            
            p_item = QTableWidgetItem(f"{it['price']:,}")
            p_item.setTextAlignment(Qt.AlignRight | Qt.AlignVCenter)
            self.table.setItem(i, 4, p_item)
            
        self.status_lbl.setText(f"{len(items)}개의 자료가 있습니다.")
        
    def add_item(self):
        dlg = AddEditItemDialog(self)
        if dlg.exec():
            d = dlg.result_data
            add_item(d["code"], d["name"], d["spec"], d["price"])
            self.load_data()
            
    def edit_item(self):
        curr = self.table.currentRow()
        if curr < 0:
            QMessageBox.warning(self, "선택 오류", "수정할 물품을 먼저 클릭하여 선택해주세요.")
            return
            
        i_id = int(self.table.item(curr, 0).text())
        i_data = {
            "id": i_id,
            "code": self.table.item(curr, 1).text() if self.table.item(curr, 1) else "",
            "name": self.table.item(curr, 2).text() if self.table.item(curr, 2) else "",
            "spec": self.table.item(curr, 3).text() if self.table.item(curr, 3) else "",
            "price": int(self.table.item(curr, 4).text().replace(',', '')) if self.table.item(curr, 4) else 0,
        }
        dlg = AddEditItemDialog(self, item_data=i_data)
        if dlg.exec():
            d = dlg.result_data
            update_item(d["id"], d["code"], d["name"], d["spec"], d["price"])
            self.load_data()

    def on_item_double_clicked(self, item_widget):
        row = item_widget.row()
        self.selected_item = {
            "code": self.table.item(row, 1).text() if self.table.item(row, 1) else "",
            "name": self.table.item(row, 2).text() if self.table.item(row, 2) else "",
            "spec": self.table.item(row, 3).text() if self.table.item(row, 3) else "",
            "price": self.table.item(row, 4).text().replace(',', '') if self.table.item(row, 4) else "0"
        }
        self.accept()
