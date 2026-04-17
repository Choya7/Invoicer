from PySide6.QtWidgets import QWidget, QVBoxLayout, QTabWidget

from ui.pages.input_page import InputPage
from ui.pages.list_page import ListPage
from ui.pages.detail_page import DetailPage

class MainWindow(QWidget):
    def __init__(self):
        super().__init__()

        self.setWindowTitle("거래명세서")

        layout = QVBoxLayout()

        self.tabs = QTabWidget()
        self.tabs.addTab(InputPage(), "입력")
        self.tabs.addTab(ListPage(), "목록")
        self.tabs.addTab(DetailPage(), "상세")

        layout.addWidget(self.tabs)
        self.setLayout(layout)