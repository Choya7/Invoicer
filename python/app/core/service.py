class InvoiceService:

    @staticmethod
    def calculate(qty, price):
        supply = qty * price
        tax = int(supply * 0.1)
        return supply, tax