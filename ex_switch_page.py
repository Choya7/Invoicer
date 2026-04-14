from PySide6.QtWidgets import QApplication, QWidget, QVBoxLayout, QPushButton, QStackedWidget

class InputPage(QWidget):
    def __init__(self, switch_func):
        super().__init__()
        layout = QVBoxLayout()

        btn = QPushButton("목록으로 이동")
        btn.clicked.connect(lambda: switch_func(1))

        layout.addWidget(btn)
        self.setLayout(layout)


class ListPage(QWidget):
    def __init__(self, switch_func):
        super().__init__()
        layout = QVBoxLayout()

        btn = QPushButton("입력으로 이동")
        btn.clicked.connect(lambda: switch_func(0))

        layout.addWidget(btn)
        self.setLayout(layout)


class MainWindow(QWidget):
    def __init__(self):
        super().__init__()

        self.stack = QStackedWidget()

        self.input_page = InputPage(self.switch_page)
        self.list_page = ListPage(self.switch_page)

        self.stack.addWidget(self.input_page)  # index 0
        self.stack.addWidget(self.list_page)   # index 1

        layout = QVBoxLayout()
        layout.addWidget(self.stack)
        self.setLayout(layout)

    def switch_page(self, index):
        self.stack.setCurrentIndex(index)


app = QApplication([])
window = MainWindow()
window.show()
app.exec()