import sys
from PySide6.QtWidgets import QApplication, QLabel, QWidget, QHBoxLayout, QVBoxLayout, QLineEdit, QTextEdit, QPushButton, QMessageBox
from PySide6.QtGui import QPixmap
from PySide6.QtCore import Qt

class MainWindow(QWidget):
    def __init__(self):
        super().__init__()

        self.setWindowTitle("Invoicer")

        self.resize(1024, 760)
        screen = QApplication.primaryScreen().availableGeometry()
        x = (screen.width() - self.width()) // 2
        y = (screen.height() - self.height()) //2

        self.move(x,y)

        # Label
        self.label = QLabel("Wellcome to my Invoice🤖")
        self.text_label = QLabel("No signal")

        # IMG
        self.img_label = QLabel()
        pixmap = QPixmap("./app/data/chill2.jpg")
        self.img_label.setPixmap(pixmap.scaled(200,200, Qt.KeepAspectRatio))
        self.img_label.setAlignment(Qt.AlignCenter)

        #input box
        self.text_input = QLineEdit()
        self.text_input.setPlaceholderText("Input the Text...")
        self.text_input.returnPressed.connect(self.handler_enter)
        #password box
        self.password_input = QLineEdit()
        self.password_input.setPlaceholderText("password")
        self.password_input.setEchoMode(QLineEdit.Password)
        # Text Area box
        self.text_area = QTextEdit()
        self.text_area.setPlaceholderText("text area...")

        # button
        self.button = QPushButton("보기/숨기기")
        self.button.clicked.connect(self.handle_button)

        self.export_btn = QPushButton("출력")
        self.export_btn.clicked.connect(self.handle_button_export)

        #===========
        #Layout
        #===========
        
        # 비밀번호 + 보기 버튼
        password_layout = QHBoxLayout()
        password_layout.addWidget(self.password_input)
        password_layout.addWidget(self.button)

        # 하단 버튼 정렬
        bottom_layout = QHBoxLayout()
        bottom_layout.addStretch()
        bottom_layout.addWidget(self.export_btn)

        layout = QVBoxLayout()
        layout.addWidget(self.label)
        layout.addWidget(self.img_label)
        layout.addWidget(self.text_label)
        layout.addWidget(self.text_input)
        
        layout.addLayout(password_layout)
        layout.addWidget(self.text_area)

        layout.addLayout(bottom_layout)

        self.setLayout(layout)

    def handler_enter(self):
        text = self.text_input.text()
        self.text_label.setText(f"입력값: {text}")

    def handle_button(self):
        if self.password_input.echoMode() == QLineEdit.Password:
            self.password_input.setEchoMode(QLineEdit.Normal)
        else:
            self.password_input.setEchoMode(QLineEdit.Password)
    
    def handle_button_export(self):
        text = self.text_area.toPlainText()
        QMessageBox.information(self, "text_area", text)
        reply = QMessageBox.question(
            self,
            "확인",
            f"입력값: {text}, 정말로 모든 데이터를 삭제하시겠습니까?",
            QMessageBox.Yes | QMessageBox.No
        )
        if reply == QMessageBox.Yes:
            self.text_input.setText("")
            self.password_input.setText("")
            self.text_area.setText("")


app = QApplication([])
window = MainWindow()
window.show()
sys.exit(app.exec())