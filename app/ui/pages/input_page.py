from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout,
    QPushButton, QLabel, QGridLayout,
    QLineEdit, QComboBox, QDateEdit,
    QTableWidget, QTableWidgetItem
)
from PySide6.QtCore import Qt


class InputPage(QWidget):
    def __init__(self):
        super().__init__()

        self.layout = QVBoxLayout()

        # ✅ 버튼 영역
        btn_layout = QHBoxLayout()
        btn_layout.addWidget(QPushButton("새로 작성"))
        btn_layout.addWidget(QPushButton("저장"))
        btn_layout.addWidget(QPushButton("삭제"))
        btn_layout.addWidget(QPushButton("인쇄"))

        # ✅ 입력 영역
        form_layout = QGridLayout()

        self.date = QDateEdit()
        self.client = QComboBox()

        self.name = QLineEdit()
        self.name.setReadOnly(True)

        form_layout.addWidget(QLabel("발행일"), 0, 0)
        form_layout.addWidget(self.date, 0, 1)
        form_layout.addWidget(QLabel("거래처"), 1, 0)
        form_layout.addWidget(self.client, 1, 1)

        form_layout.addWidget(QLabel("상호"), 0, 2)
        form_layout.addWidget(self.name, 0, 3)

        # ✅ 합계
        self.total_label = QLabel("0")

        # ✅ 테이블
        self.table = QTableWidget(0, 8)
        self.table.setHorizontalHeaderLabels([
            "월일", "품목코드", "품목", "규격",
            "수량", "단가", "공급가액", "세액"
        ])

        self.table.cellChanged.connect(self.on_cell_changed)

        self.table.insertRow(0)

        # ✅ 조립
        self.layout.addLayout(btn_layout)
        self.layout.addLayout(form_layout)
        self.layout.addWidget(self.total_label)
        self.layout.addWidget(self.table)

        self.setLayout(self.layout)

    def on_cell_changed(self, row, col):
        if col not in [4, 5]:
            return

        qty = self.get_value(row, 4)
        price = self.get_value(row, 5)

        supply = qty * price
        tax = int(supply * 0.1)

        self.table.blockSignals(True)

        self.table.setItem(row, 6, QTableWidgetItem(str(supply)))
        self.table.setItem(row, 7, QTableWidgetItem(str(tax)))

        self.table.blockSignals(False)

        self.update_total()

    def get_value(self, row, col):
        item = self.table.item(row, col)
        if item and item.text().isdigit():
            return int(item.text())
        return 0

    def update_total(self):
        total = 0
        for row in range(self.table.rowCount()):
            item = self.table.item(row, 6)
            if item and item.text().isdigit():
                total += int(item.text())

        self.total_label.setText(str(total))