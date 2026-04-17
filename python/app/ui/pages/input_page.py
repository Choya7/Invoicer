from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QGridLayout,
    QPushButton, QLabel, QLineEdit, QComboBox, QDateEdit,
    QTableWidget, QTableWidgetItem, QCheckBox, QGroupBox, 
    QRadioButton, QHeaderView, QFrame, QStyledItemDelegate, QMessageBox
)
from core.database import save_invoice
from PySide6.QtCore import Qt, QDate, QEvent
from PySide6.QtGui import QFont, QIntValidator

class NumericDelegate(QStyledItemDelegate):
    def createEditor(self, parent, option, index):
        editor = super().createEditor(parent, option, index)
        if isinstance(editor, QLineEdit):
            editor.setValidator(QIntValidator())
        return editor

class InputPage(QWidget):
    def __init__(self):
        super().__init__()
        self.init_ui()

    def init_ui(self):
        main_layout = QVBoxLayout()
        main_layout.setContentsMargins(5, 5, 5, 5)
        
        # 1. Toolbar
        main_layout.addLayout(self._build_toolbar())

        # Main content split: Left (Document) and Right (Side panel)
        content_layout = QHBoxLayout()
        
        # Document (Left)
        doc_layout = QVBoxLayout()
        doc_layout.addLayout(self._build_header())
        doc_layout.addLayout(self._build_total_row())
        doc_layout.addWidget(self._build_table())
        doc_layout.addLayout(self._build_footer())
        
        content_layout.addLayout(doc_layout, stretch=4)
        
        # Side Panel (Right)
        content_layout.addWidget(self._build_side_panel(), stretch=1)

        main_layout.addLayout(content_layout)
        self.setLayout(main_layout)
        
        self._sync_date_to_table(self.date_edit.date())
        
        # Apply CSS-like styles
        self.setStyleSheet("""
            QWidget { 
                font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
                color: #111111; 
                font-size: 13px;
            }
            QLabel { 
                font-weight: bold;
            }
            QLineEdit, QComboBox, QDateEdit { 
                font-size: 13px; 
                padding: 4px; 
                background-color: #ffffff; 
                border: 1px solid #888888;
                border-radius: 2px;
                color: #000000;
            }
            QLineEdit:focus, QComboBox:focus, QDateEdit:focus {
                border: 2px solid #005bb5;
            }
            QTableWidget { 
                gridline-color: #aaaaaa; 
                selection-background-color: #b3d4fc; 
                selection-color: black; 
                background-color: #ffffff; 
                color: #000000;
            }
            QHeaderView::section { 
                background-color: #e3ebf3; 
                font-weight: bold; 
                border: 1px solid #aaaaaa; 
                padding: 5px; 
                color: #000000; 
            }
            QPushButton { 
                padding: 5px 12px; 
                background-color: #f8f9fa;
                border: 1px solid #cccccc;
                border-radius: 3px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #e2e6ea;
            }
            QPushButton:pressed {
                background-color: #c8d0d6;
                border: 1px inset #888888;
                color: #000000;
            }
            QGroupBox { 
                font-weight: bold; 
                border: 1px solid #888888; 
                margin-top: 15px; 
                border-radius: 3px;
            }
            QGroupBox::title { 
                subcontrol-origin: margin; 
                subcontrol-position: top left; 
                padding: 0 5px; 
                color: #003366;
            }
            QCheckBox { 
                color: #000000; 
                font-size: 13px; 
                font-weight: bold;
                background: transparent;
            }
            QMessageBox {
                background-color: #ffffff;
            }
            QMessageBox QLabel {
                color: #000000;
                font-size: 13px;
            }
        """)

    def _build_toolbar(self):
        layout = QHBoxLayout()
        layout.setSpacing(5)
        
        # Buttons
        self.btn_new = QPushButton("새로작성")
        self.btn_save = QPushButton("저장")
        self.btn_new.clicked.connect(self.clear_form)
        self.btn_save.clicked.connect(self.save_form)
        layout.addWidget(self.btn_new)
        layout.addWidget(self.btn_save)
        
        btns = ["삭제", "인쇄", "전자발행", "목록", "닫기"]
        for b in btns:
            btn = QPushButton(b)
            layout.addWidget(btn)
        
        layout.addStretch()
        
        # Checkboxes
        chk_layout = QHBoxLayout()
        chk_new = QCheckBox("같은 내용으로\n새로 작성")
        chk_print = QCheckBox("저장하지 않고\n인쇄")
        chk_new.setStyleSheet("QCheckBox { padding: 2px; }")
        chk_print.setStyleSheet("QCheckBox { padding: 2px; }")
        chk_layout.addWidget(chk_new)
        chk_layout.addWidget(chk_print)
        
        tax_chk = QCheckBox("세액계산")
        tax_chk.setChecked(True)
        chk_layout.addWidget(tax_chk)
        
        chk_layout.addWidget(QCheckBox("수동계산"))
        layout.addLayout(chk_layout)
        
        return layout

    def _build_header(self):
        layout = QHBoxLayout()
        
        frame_style = "QFrame { border: 2px solid #285e8e; border-radius: 5px; background-color: #ffffff; }"
        
        # --- Left Header: Client info ---
        left_frame = QFrame()
        left_frame.setStyleSheet(frame_style)
        left_layout = QGridLayout()
        left_layout.setContentsMargins(10, 10, 10, 10)
        
        title_lbl = QLabel("거래명세서")
        title_font = QFont()
        title_font.setPointSize(22)
        title_font.setBold(True)
        title_lbl.setFont(title_font)
        title_lbl.setAlignment(Qt.AlignCenter)
        title_lbl.setStyleSheet("border: none;")
        
        sub_title = QLabel("(공급받는자 보관용)")
        sub_title.setAlignment(Qt.AlignCenter)
        sub_title.setStyleSheet("border: none; font-size: 14px;")
        
        title_layout = QVBoxLayout()
        title_layout.addWidget(title_lbl)
        title_layout.addWidget(sub_title)
        
        left_layout.addWidget(QLabel("전체 1 Page"), 0, 0, 1, 2)
        left_layout.addWidget(QLabel("발행일"), 1, 0)
        
        self.date_edit = QDateEdit(QDate.currentDate())
        self.date_edit.setCalendarPopup(True)
        self.date_edit.dateChanged.connect(self._sync_date_to_table)
        left_layout.addWidget(self.date_edit, 1, 1)
        
        left_layout.addWidget(QLabel("거래처명"), 2, 0)
        
        client_layout = QHBoxLayout()
        self.client_combo = QComboBox()
        self.client_combo.setEditable(True)
        client_layout.addWidget(self.client_combo)
        
        btn_search_client = QPushButton("🔍")
        btn_search_client.setStyleSheet("padding: 5px;")
        btn_search_client.clicked.connect(self.open_client_dialog)
        client_layout.addWidget(btn_search_client)
        
        left_layout.addLayout(client_layout, 2, 1)
        
        left_layout.addLayout(title_layout, 0, 2, 3, 1)
        left_frame.setLayout(left_layout)
        
        # --- Right Header: Supplier info ---
        right_frame = QFrame()
        right_frame.setStyleSheet(frame_style)
        right_layout = QGridLayout()
        right_layout.setSpacing(6)
        right_layout.setContentsMargins(8, 8, 8, 8)
        
        supplier_lbl = QLabel("공\n급\n자")
        supplier_lbl.setStyleSheet("font-weight: bold; font-size: 15px; background-color: #d8e5f2; text-align: center; border: 1px solid #888888; color: #003366;")
        supplier_lbl.setAlignment(Qt.AlignCenter)
        right_layout.addWidget(supplier_lbl, 0, 0, 4, 1)
        
        right_layout.addWidget(QLabel("등록번호"), 0, 1)
        self.sup_reg = QLineEdit("760-24-02241")
        right_layout.addWidget(self.sup_reg, 0, 2, 1, 3)
        right_layout.addWidget(QLabel("상  호"), 1, 1)
        self.sup_name = QLineEdit("광성")
        right_layout.addWidget(self.sup_name, 1, 2)
        right_layout.addWidget(QLabel("성  명"), 1, 3)
        self.sup_owner = QLineEdit("정광성")
        right_layout.addWidget(self.sup_owner, 1, 4)
        
        right_layout.addWidget(QLabel("주  소"), 2, 1)
        self.sup_addr = QLineEdit("대구광역시 달성군 다사읍 세천로 955 2층")
        right_layout.addWidget(self.sup_addr, 2, 2, 1, 3)
        
        right_layout.addWidget(QLabel("업  태"), 3, 1)
        self.sup_type = QLineEdit("제조업")
        right_layout.addWidget(self.sup_type, 3, 2)
        right_layout.addWidget(QLabel("종  목"), 3, 3)
        self.sup_cat = QLineEdit("침구류")
        right_layout.addWidget(self.sup_cat, 3, 4)
        
        right_frame.setLayout(right_layout)
        
        layout.addWidget(left_frame, stretch=1)
        layout.addWidget(right_frame, stretch=1)
        
        return layout

    def _build_total_row(self):
        layout = QHBoxLayout()
        
        tot_lbl = QLabel("합계금액")
        tot_lbl.setStyleSheet("background-color: #436b95; color: #ffffff; font-weight: bold; font-size: 18px; padding: 6px; border-radius: 3px;")
        tot_lbl.setFixedWidth(130)
        tot_lbl.setAlignment(Qt.AlignCenter)
        
        self.header_total_val = QLineEdit()
        self.header_total_val.setReadOnly(True)
        self.header_total_val.setStyleSheet("font-size: 20px; font-weight: bold; border: 2px solid #436b95; background-color: #fff9e6; color: #cc0000; padding: 5px;")
        self.header_total_val.setAlignment(Qt.AlignRight)
        
        layout.addWidget(tot_lbl)
        layout.addWidget(self.header_total_val)
        return layout

    def _build_table(self):
        self.table = QTableWidget(12, 8)
        self.table.setHorizontalHeaderLabels([
            "월일", "품목코드", "품목", "규격",
            "수량", "단가", "공급가액", "세액"
        ])
        # Set column widths to match a bill
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.Interactive)
        self.table.horizontalHeader().setStretchLastSection(True)
        self.table.setColumnWidth(0, 60)
        self.table.setColumnWidth(1, 80)
        self.table.setColumnWidth(2, 200)
        self.table.setColumnWidth(3, 60)
        self.table.setColumnWidth(4, 60)
        self.table.setColumnWidth(5, 80)
        self.table.setColumnWidth(6, 120)
        num_delegate = NumericDelegate(self.table)
        self.table.setItemDelegateForColumn(4, num_delegate)
        self.table.setItemDelegateForColumn(5, num_delegate)
        
        for r in range(12):
            for c in range(8):
                item = QTableWidgetItem("")
                if c in [1, 6, 7]:  # 1: code, 6: supply, 7: tax
                    item.setFlags(item.flags() & ~Qt.ItemIsEditable)
                if c in [4, 5]:
                    item.setTextAlignment(Qt.AlignRight | Qt.AlignVCenter)
                self.table.setItem(r, c, item)
        
        self.table.cellChanged.connect(self.on_cell_changed)
        self.table.cellClicked.connect(self.on_cell_clicked)
        self.table.installEventFilter(self)
        return self.table
        
    def _sync_date_to_table(self, new_date):
        date_str = new_date.toString("MM.dd")
        self.table.blockSignals(True)
        for row in range(self.table.rowCount()):
            item = self.table.item(row, 0)
            if not item:
                item = QTableWidgetItem()
                item.setTextAlignment(Qt.AlignCenter)
                self.table.setItem(row, 0, item)
            item.setText(date_str)
        self.table.blockSignals(False)

    def _build_footer(self):
        layout = QVBoxLayout()
        
        # Sum Row
        sum_layout = QHBoxLayout()
        labels = ["전잔금", "총합계", "입금", "총잔액", "인수자"]
        self.footer_inputs = {}
        for lbl_text in labels:
            lbl_widget = QLabel(lbl_text)
            lbl_widget.setStyleSheet("background-color: #8da4b8; color: white; padding: 2px; text-align: center;")
            lbl_widget.setAlignment(Qt.AlignCenter)
            sum_layout.addWidget(lbl_widget)
            
            line_edit = QLineEdit("0" if lbl_text != "인수자" else "")
            line_edit.setAlignment(Qt.AlignRight if lbl_text != "인수자" else Qt.AlignLeft)
            sum_layout.addWidget(line_edit)
            self.footer_inputs[lbl_text] = line_edit
        
        layout.addLayout(sum_layout)
        
        return layout

    def _build_side_panel(self):
        panel = QFrame()
        panel.setStyleSheet("QFrame { background-color: #ebf0f5; border: 1px solid #bbbbbb; border-radius: 4px; }")
        panel.setFixedWidth(200)
        layout = QVBoxLayout()
        layout.setContentsMargins(15, 15, 15, 15)
        
        # Electronic Issue Section
        e_issue_group = QGroupBox("전자발행")
        e_issue_layout = QVBoxLayout()
        e_btn1 = QPushButton("전자발행 (Go)")
        e_btn1.setStyleSheet("background-color: #ffffff; border: 1px solid #888888;")
        e_btn2 = QPushButton("백지출력 서비스")
        e_btn2.setStyleSheet("background-color: #ffffff; border: 1px solid #888888;")
        e_issue_layout.addWidget(e_btn1)
        e_issue_layout.addWidget(e_btn2)
        e_issue_group.setLayout(e_issue_layout)
        layout.addWidget(e_issue_group)
        
        # Tax Setup Section
        tax_group = QGroupBox("세율 10%")
        tax_layout = QVBoxLayout()
        
        self.vat_separate = QRadioButton("VAT별도")
        self.vat_inc = QRadioButton("VAT포함")
        self.vat_separate.setChecked(True)
        self.vat_separate.toggled.connect(self._recalc_all_rows)
        
        tax_layout.addWidget(self.vat_separate)
        tax_layout.addWidget(self.vat_inc)
        tax_group.setLayout(tax_layout)
        layout.addWidget(tax_group)
        
        # Row Control Section
        self.row_group = QGroupBox("현재 0 줄 선택됨")
        row_layout = QVBoxLayout()
        btn_insert = QPushButton("삽입 (Insert)")
        btn_delete = QPushButton("삭제 (Delete)")
        
        btn_insert.clicked.connect(self.insert_row)
        btn_delete.clicked.connect(self.delete_row)
        
        row_layout.addWidget(btn_insert)
        row_layout.addWidget(btn_delete)
        self.row_group.setLayout(row_layout)
        layout.addWidget(self.row_group)
        
        self.table.itemSelectionChanged.connect(self.on_selection_changed)
        
        layout.addStretch()
        panel.setLayout(layout)
        return panel

    def on_selection_changed(self):
        selected_ranges = self.table.selectedRanges()
        rows_selected = sum(r.rowCount() for r in selected_ranges)
        self.row_group.setTitle(f"현재 {rows_selected} 줄 선택됨")

    def _recalc_all_rows(self):
        for i in range(self.table.rowCount()):
            self.on_cell_changed(i, 4) # Trigger recalculation

    def on_cell_changed(self, row, col):
        if col not in [4, 5]:  # Quantity or Price
            return

        qty = self.get_value(row, 4)
        price = self.get_value(row, 5)

        if self.vat_separate.isChecked():
            supply = qty * price
            tax = int(supply * 0.1)
        else:
            total_val = qty * price
            supply = int(total_val / 1.1)
            tax = total_val - supply

        self.table.blockSignals(True)
        if qty == 0 and price == 0 and supply == 0 and tax == 0:
            self.table.setItem(row, 6, QTableWidgetItem(""))
            self.table.setItem(row, 7, QTableWidgetItem(""))
        else:
            self.table.setItem(row, 6, QTableWidgetItem(f"{supply:,}"))
            self.table.setItem(row, 7, QTableWidgetItem(f"{tax:,}"))
        self.table.blockSignals(False)

        self.update_total()

    def get_value(self, row, col):
        item = self.table.item(row, col)
        if item:
            text = item.text().replace(',', '')
            if text.isdigit() or (text.startswith('-') and text[1:].isdigit()):
                return int(text)
        return 0

    def update_total(self):
        total_supply = 0
        total_tax = 0
        for row in range(self.table.rowCount()):
            total_supply += self.get_value(row, 6)
            total_tax += self.get_value(row, 7)

        grand_total = total_supply + total_tax
        grand_str = f"{grand_total:,}"
        
        self.header_total_val.setText(grand_str)
        if hasattr(self, 'footer_inputs'):
            if "총합계" in self.footer_inputs:
                self.footer_inputs["총합계"].setText(grand_str)
            if "총잔액" in self.footer_inputs:
                self.footer_inputs["총잔액"].setText(grand_str)

    def insert_row(self):
        curr_row = self.table.currentRow()
        if curr_row < 0:
            curr_row = self.table.rowCount()
        self.table.insertRow(curr_row)
        for c in range(8):
            item = QTableWidgetItem("")
            if c in [1, 6, 7]:
                item.setFlags(item.flags() & ~Qt.ItemIsEditable)
            if c in [4, 5]:
                item.setTextAlignment(Qt.AlignRight | Qt.AlignVCenter)
            self.table.setItem(curr_row, c, item)
        self._sync_date_to_table(self.date_edit.date())
        self.update_total()

    def eventFilter(self, obj, event):
        if hasattr(self, 'table') and obj == self.table and event.type() == QEvent.KeyPress:
            if event.key() == Qt.Key_Tab:
                if self.table.currentRow() == self.table.rowCount() - 1 and self.table.currentColumn() == self.table.columnCount() - 1:
                    new_row = self.table.rowCount()
                    self.insert_row()
                    return True
            elif event.key() in (Qt.Key_Return, Qt.Key_Enter):
                if self.table.currentColumn() == 1:
                    self.open_item_dialog(self.table.currentRow())
                    return True 
        return super().eventFilter(obj, event)

    def delete_row(self):
        curr_row = self.table.currentRow()
        if curr_row >= 0:
            self.table.removeRow(curr_row)
            self.update_total()

    def clear_form(self):
        self.date_edit.setDate(QDate.currentDate())
        self.client_combo.setCurrentText("")
        
        self.table.blockSignals(True)
        for row in range(self.table.rowCount()):
            for col in range(1, self.table.columnCount()):
                item = self.table.item(row, col)
                if item:
                    item.setText("")
        self.table.blockSignals(False)
        self.update_total()
        
        for name, le in self.footer_inputs.items():
            le.setText("0" if name != "인수자" else "")

    def save_form(self):
        issue_date = self.date_edit.date().toString("yyyy-MM-dd")
        client_name = self.client_combo.currentText().strip()
        
        if not client_name:
            msg = QMessageBox(self)
            msg.setWindowTitle("저장 실패")
            msg.setText("거래처가 선택되지 않았습니다.")
            msg.setInformativeText("저장하기 전 반드시 거래처를 입력하거나 목록에서 선택해주세요.")
            msg.setStyleSheet("QLabel { color: #000; font-size: 13px; }")
            msg.exec()
            return
            
        items = []
        for r in range(self.table.rowCount()):
            name_item = self.table.item(r, 2)
            if name_item and name_item.text().strip(): 
                item = {
                    "date": self.table.item(r, 0).text() if self.table.item(r, 0) else "",
                    "code": self.table.item(r, 1).text() if self.table.item(r, 1) else "",
                    "name": name_item.text(),
                    "spec": self.table.item(r, 3).text() if self.table.item(r, 3) else "",
                    "qty": self.get_value(r, 4),
                    "price": self.get_value(r, 5),
                    "supply": self.get_value(r, 6),
                    "tax": self.get_value(r, 7),
                }
                items.append(item)
                
        if not items:
            msg = QMessageBox(self)
            msg.setWindowTitle("저장 실패")
            msg.setText("품목이 비어있습니다.")
            msg.setInformativeText("저장하기 전 명세서에 최소 1개 이상의 물품 내역을 작성해주세요.")
            msg.setStyleSheet("QLabel { color: #000; font-size: 13px; }")
            msg.exec()
            return
                
        data = {
            "supplier": {
                "reg_no": self.sup_reg.text(),
                "name": self.sup_name.text(),
                "owner": self.sup_owner.text(),
                "address": self.sup_addr.text(),
                "type": self.sup_type.text(),
                "category": self.sup_cat.text()
            },
            "items": items,
            "footer": {k: v.text() for k, v in self.footer_inputs.items()},
            "grand_total": self.header_total_val.text()
        }
        
        unique_id = save_invoice(issue_date, client_name, data)
        msg_box = QMessageBox(self)
        msg_box.setWindowTitle("저장 완료")
        msg_box.setText("명세서가 성공적으로 저장되었습니다.")
        msg_box.setInformativeText(f"고유 ID (보안 키):\n{unique_id}")
        msg_box.setStyleSheet("QMessageBox { background-color: #ffffff; } QLabel { color: #000000; font-size: 13px; }")
        msg_box.exec()

    def open_client_dialog(self):
        from ui.pages.client_dialog import ClientSearchDialog
        dialog = ClientSearchDialog(self)
        if dialog.exec():
            selected = dialog.selected_client
            if selected:
                if self.client_combo.findText(selected) == -1:
                    self.client_combo.addItem(selected)
                self.client_combo.setCurrentText(selected)
                
    def on_cell_clicked(self, row, col):
        if col == 1: # 품목코드
            self.open_item_dialog(row)
            
    def open_item_dialog(self, row):
        from ui.pages.item_dialog import ItemSearchDialog
        dlg = ItemSearchDialog(self)
        if dlg.exec() and dlg.selected_item:
            item = dlg.selected_item
            
            self.table.blockSignals(True)
            if self.table.item(row, 1):
                self.table.item(row, 1).setText(item["code"])
            if self.table.item(row, 2):
                self.table.item(row, 2).setText(item["name"])
            if self.table.item(row, 3):
                self.table.item(row, 3).setText(item["spec"])
            if self.table.item(row, 4):
                self.table.item(row, 4).setText("1")
            if self.table.item(row, 5):
                self.table.item(row, 5).setText(str(item["price"]))
            self.table.blockSignals(False)
            
            self.on_cell_changed(row, 4) # Trigger overall table calculation