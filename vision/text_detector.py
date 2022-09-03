#https://github.com/jaidedai/easyocr
import easyocr

class textReader:
    def __init__(self, model, lang):
        self.reader = easyocr.Reader([model, lang])
    def readText(self, img):
        return self.reader.readtext(img)
        