import sqlite3
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = BASE_DIR / "cuidare.db"


def coluna_existe(cursor, tabela, coluna):
    cursor.execute(f"PRAGMA table_info({tabela})")
    colunas = [linha[1] for linha in cursor.fetchall()]
    return coluna in colunas


def main():
    print("=" * 60)
    print("CUIDARE - MIGRAÇÃO DO TROCO DO CAIXA")
    print("=" * 60)

    if not DATABASE_PATH.exists():
        raise FileNotFoundError(
            f"Banco não encontrado: {DATABASE_PATH}"
        )

    db = sqlite3.connect(DATABASE_PATH)

    try:
        cursor = db.cursor()

        print("\nBanco:", DATABASE_PATH)

        # --------------------------------------------------
        # troco_proxima_abertura
        # --------------------------------------------------
        if not coluna_existe(
            cursor,
            "caixas",
            "troco_proxima_abertura",
        ):
            print(
                "Adicionando coluna: "
                "troco_proxima_abertura"
            )

            cursor.execute(
                """
                ALTER TABLE caixas
                ADD COLUMN troco_proxima_abertura
                NUMERIC(12, 2)
                NOT NULL
                DEFAULT 0
                """
            )
        else:
            print(
                "OK: troco_proxima_abertura "
                "já existe."
            )

        # --------------------------------------------------
        # valor_retirado
        # --------------------------------------------------
        if not coluna_existe(
            cursor,
            "caixas",
            "valor_retirado",
        ):
            print(
                "Adicionando coluna: valor_retirado"
            )

            cursor.execute(
                """
                ALTER TABLE caixas
                ADD COLUMN valor_retirado
                NUMERIC(12, 2)
                NOT NULL
                DEFAULT 0
                """
            )
        else:
            print(
                "OK: valor_retirado "
                "já existe."
            )

        # --------------------------------------------------
        # caixa_origem_troco_id
        # --------------------------------------------------
        if not coluna_existe(
            cursor,
            "caixas",
            "caixa_origem_troco_id",
        ):
            print(
                "Adicionando coluna: "
                "caixa_origem_troco_id"
            )

            cursor.execute(
                """
                ALTER TABLE caixas
                ADD COLUMN caixa_origem_troco_id
                INTEGER
                """
            )
        else:
            print(
                "OK: caixa_origem_troco_id "
                "já existe."
            )

        db.commit()

        print("\n" + "=" * 60)
        print("ESTRUTURA FINAL DA TABELA CAIXAS")
        print("=" * 60)

        cursor.execute("PRAGMA table_info(caixas)")

        for coluna in cursor.fetchall():
            print(coluna)

        print("\nMigração concluída com sucesso.")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()
