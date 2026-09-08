# CUIDARE — PLANO COMPLETO DE CONFERÊNCIA DE CAIXA

## OBJETIVO

Aprimorar o módulo Caixa para separar claramente:

1. SALDO FINANCEIRO TOTAL
2. DINHEIRO EM ESPÉCIE
3. VALORES ELETRÔNICOS
4. CONFERÊNCIA DO CAIXA
5. DIFERENÇAS NO FECHAMENTO

A implementação deve preservar o funcionamento atual de abertura,
movimentações, fechamento e integração com Contas a Receber e
Contas a Pagar.

---

# 1. REGRA PRINCIPAL

Exemplo:

Saldo inicial:
R$ 100,00 em espécie

Paciente 1:
R$ 150,00 em dinheiro

Paciente 2:
R$ 150,00 em cartão

Resultado:

SALDO FINANCEIRO:
R$ 400,00

DINHEIRO EM ESPÉCIE:
R$ 250,00

CARTÃO:
R$ 150,00

DINHEIRO FÍSICO NA GAVETA:
R$ 250,00

O pagamento por cartão NÃO aumenta o dinheiro físico.

A mesma regra vale para:

- Pix
- cartão de crédito
- cartão de débito
- transferência bancária

---

# 2. MEIOS DE PAGAMENTO

## DINHEIRO

Impacta dinheiro em espécie:

- dinheiro

## ELETRÔNICOS

Não impactam dinheiro em espécie:

- pix
- cartao_credito
- cartao_debito
- transferencia

## OUTRO

- outro

Não assumir automaticamente que "outro" seja dinheiro.

---

# 3. SALDO FINANCEIRO

O saldo financeiro deve continuar considerando todas as
movimentações válidas.

Fórmula:

SALDO FINANCEIRO =
SALDO INICIAL
+ ENTRADAS
+ SUPRIMENTOS
- SAÍDAS
- SANGRIAS

Esse saldo representa o resultado financeiro total.

---

# 4. DINHEIRO EM ESPÉCIE

Criar cálculo específico para dinheiro físico.

Fórmula:

DINHEIRO ESPERADO =
DINHEIRO INICIAL
+ ENTRADAS EM DINHEIRO
+ SUPRIMENTOS EM DINHEIRO
- SAÍDAS EM DINHEIRO
- SANGRIAS EM DINHEIRO

IMPORTANTE:

Pix não entra.

Cartão de crédito não entra.

Cartão de débito não entra.

Transferência bancária não entra.

---

# 5. VALORES ELETRÔNICOS

Criar resumo separado:

PIX
CARTÃO DE CRÉDITO
CARTÃO DE DÉBITO
TRANSFERÊNCIA

Mostrar o total de cada modalidade.

Também mostrar:

TOTAL ELETRÔNICO

---

# 6. NOVO RESUMO DO CAIXA

No Caixa aberto, apresentar:

SALDO FINANCEIRO
R$ 400,00

DINHEIRO EM ESPÉCIE
R$ 250,00

VALORES ELETRÔNICOS
R$ 150,00

Depois mostrar:

DISTRIBUIÇÃO POR MEIO DE PAGAMENTO

Dinheiro
R$ 250,00

Pix
R$ 0,00

Cartão de crédito
R$ 150,00

Cartão de débito
R$ 0,00

Transferência
R$ 0,00

---

# 7. NOVA ABA: CONFERÊNCIA DO CAIXA

Criar uma aba/seção:

CONFERÊNCIA DO CAIXA

Ela deverá permitir conferir os valores por meio de pagamento.

---

# 8. CONFERÊNCIA DO DINHEIRO

Mostrar:

DINHEIRO ESPERADO
R$ 250,00

DINHEIRO CONTADO
[ campo ]

DIFERENÇA
R$ 0,00

Fórmula:

DIFERENÇA =
DINHEIRO CONTADO - DINHEIRO ESPERADO

Exemplo:

Esperado: R$ 250,00
Contado: R$ 248,00

Diferença:
-R$ 2,00

Situação:

FALTA DE CAIXA

---

# 9. CONFERÊNCIA DO PIX

Mostrar:

PIX REGISTRADO
R$ 100,00

PIX CONFERIDO
[ campo ]

DIFERENÇA
R$ 0,00

---

# 10. CONFERÊNCIA DO CARTÃO DE CRÉDITO

Mostrar:

CARTÃO DE CRÉDITO REGISTRADO
R$ 150,00

CARTÃO DE CRÉDITO CONFERIDO
[ campo ]

DIFERENÇA
R$ 0,00

---

# 11. CONFERÊNCIA DO CARTÃO DE DÉBITO

Mostrar:

CARTÃO DE DÉBITO REGISTRADO
R$ 0,00

CARTÃO DE DÉBITO CONFERIDO
[ campo ]

DIFERENÇA
R$ 0,00

---

# 12. CONFERÊNCIA DA TRANSFERÊNCIA

Mostrar:

TRANSFERÊNCIA REGISTRADA
R$ 0,00

TRANSFERÊNCIA CONFERIDA
[ campo ]

DIFERENÇA
R$ 0,00

---

# 13. TOTAL DA CONFERÊNCIA

Mostrar:

TOTAL REGISTRADO
R$ XXX

TOTAL CONFERIDO
R$ XXX

DIFERENÇA TOTAL
R$ XXX

---

# 14. FECHAMENTO DO CAIXA

O fechamento atual possui:

saldo_final

A nova lógica deverá permitir registrar também:

- dinheiro contado
- Pix conferido
- cartão crédito conferido
- cartão débito conferido
- transferência conferida
- observações

O sistema calcula automaticamente as diferenças.

---

# 15. EXEMPLO DE FECHAMENTO

DINHEIRO

Esperado:
R$ 250,00

Contado:
R$ 250,00

Diferença:
R$ 0,00


PIX

Registrado:
R$ 100,00

Conferido:
R$ 100,00

Diferença:
R$ 0,00


CARTÃO DE CRÉDITO

Registrado:
R$ 150,00

Conferido:
R$ 150,00

Diferença:
R$ 0,00

---

# 16. DIFERENÇA DE CAIXA

Nunca apagar silenciosamente uma diferença.

Registrar:

- valor esperado
- valor conferido
- diferença
- data/hora
- caixa
- observações

Possíveis situações:

- Conferido
- Sobra de caixa
- Falta de caixa

---

# 17. BANCO DE DADOS

Preservar as tabelas existentes:

- caixas
- movimentacoes_caixa
- contas_receber
- contas_pagar

Adicionar uma tabela específica para conferência.

Nome sugerido:

conferencias_caixa

Campos sugeridos:

id
caixa_id

dinheiro_esperado
dinheiro_contado
diferenca_dinheiro

pix_registrado
pix_conferido
diferenca_pix

cartao_credito_registrado
cartao_credito_conferido
diferenca_cartao_credito

cartao_debito_registrado
cartao_debito_conferido
diferenca_cartao_debito

transferencia_registrada
transferencia_conferida
diferenca_transferencia

total_registrado
total_conferido
diferenca_total

observacoes
criado_em

Os nomes finais devem seguir o padrão dos modelos SQLAlchemy
existentes.

---

# 18. CONTAS A RECEBER

Quando uma conta passar para "pago":

DINHEIRO:

tipo = entrada
categoria = recebimento
forma_pagamento = dinheiro

Deve aumentar dinheiro físico.

PIX:

forma_pagamento = pix

Não deve aumentar dinheiro físico.

CARTÃO DE CRÉDITO:

Não deve aumentar dinheiro físico.

CARTÃO DE DÉBITO:

Não deve aumentar dinheiro físico.

TRANSFERÊNCIA:

Não deve aumentar dinheiro físico.

Manter a integração automática existente.

---

# 19. CONTAS A PAGAR

Quando uma conta passar para "pago":

DINHEIRO:

Registrar saída e reduzir dinheiro físico.

PIX:

Registrar saída financeira.

Não reduzir dinheiro físico.

CARTÃO:

Registrar saída financeira.

Não reduzir dinheiro físico.

TRANSFERÊNCIA:

Registrar saída financeira.

Não reduzir dinheiro físico.

---

# 20. SANGRIA

Sangria deve reduzir dinheiro físico.

Exemplo:

Dinheiro esperado:
R$ 500

Sangria:
R$ 200

Novo dinheiro esperado:
R$ 300

---

# 21. SUPRIMENTO

Suprimento em dinheiro aumenta dinheiro físico.

Exemplo:

Dinheiro esperado:
R$ 200

Suprimento:
R$ 100

Novo esperado:
R$ 300

---

# 22. TABELA DE MOVIMENTAÇÕES

Manter:

- tipo
- categoria
- descrição
- valor
- forma de pagamento
- observações
- data

Melhorar visualmente a identificação da forma de pagamento.

Exemplo:

Entrada | Pagamento fisioterapia | R$ 150 | Dinheiro

Entrada | Pagamento fisioterapia | R$ 150 | Cartão crédito

---

# 23. ENDPOINTS EXISTENTES

Preservar:

GET /caixa/aberto

POST /caixa/abrir

POST /caixa/fechar

GET /caixa/movimentacoes

POST /caixa/movimentacoes

GET /caixa/saldo

---

# 24. ENDPOINTS NOVOS

Se necessário:

GET /caixa/conferencia

POST /caixa/conferencia

Ou ampliar o fechamento existente.

Preferência:

não quebrar os endpoints atuais.

---

# 25. HISTÓRICO

Depois que o caixa for fechado:

preservar:

- saldo inicial
- saldo final
- movimentações
- dinheiro esperado
- dinheiro contado
- valores eletrônicos
- valores conferidos
- diferenças
- observações
- data de abertura
- data de fechamento

Abrir um novo caixa não pode alterar o caixa anterior.

---

# 26. CARTÕES

Separar obrigatoriamente:

- cartão de crédito
- cartão de débito

Isso permitirá futuramente:

- controle por operadora
- taxas
- valores líquidos
- previsão de recebimento
- conciliação

Não implementar taxas automaticamente nesta etapa.

---

# 27. PIX

Pix deve ser tratado como valor eletrônico.

Não deve aumentar dinheiro em espécie.

No futuro poderá permitir:

- conferência bancária
- conciliação
- identificação de divergências

---

# 28. TESTE COMPLETO

Abrir caixa:

R$ 100,00

Registrar:

Entrada dinheiro:
R$ 150,00

Entrada cartão crédito:
R$ 150,00

Entrada Pix:
R$ 100,00

Saída dinheiro:
R$ 50,00

Resultado:

SALDO FINANCEIRO:
R$ 450,00

DINHEIRO EM ESPÉCIE:
R$ 200,00

CARTÃO CRÉDITO:
R$ 150,00

PIX:
R$ 100,00

TOTAL ELETRÔNICO:
R$ 250,00

TOTAL:
R$ 450,00

---

# 29. TESTES OBRIGATÓRIOS

Testar:

1. Health da API
2. Abrir caixa
3. Entrada dinheiro
4. Entrada Pix
5. Entrada cartão crédito
6. Entrada cartão débito
7. Entrada transferência
8. Saída dinheiro
9. Saída Pix
10. Saída cartão
11. Sangria
12. Suprimento
13. Saldo financeiro
14. Dinheiro físico
15. Valores eletrônicos
16. Conferência correta
17. Conferência com diferença
18. Fechamento
19. Novo caixa
20. Histórico do caixa anterior

Também testar:

Conta a Receber + dinheiro
Conta a Receber + Pix
Conta a Receber + cartão
Conta a Pagar + dinheiro
Conta a Pagar + Pix
Conta a Pagar + cartão
Conta a Pagar + transferência

---

# 30. CRITÉRIO DE ACEITAÇÃO

A alteração estará correta quando:

- cartão não aumentar dinheiro físico;
- Pix não aumentar dinheiro físico;
- transferência não aumentar dinheiro físico;
- dinheiro aumentar dinheiro físico;
- sangria reduzir dinheiro físico;
- suprimento aumentar dinheiro físico;
- saldo financeiro continuar correto;
- conferência mostrar esperado x conferido;
- diferenças forem registradas;
- fechamento preservar histórico;
- Contas a Receber continuar integrada;
- Contas a Pagar continuar integrada;
- nenhum dado financeiro existente for apagado.

---

# 31. REGRA DE OURO

O Cuidare deverá trabalhar com três conceitos:

1. SALDO FINANCEIRO

Tudo que entrou menos tudo que saiu.

2. DINHEIRO EM ESPÉCIE

Somente dinheiro físico que deveria estar na gaveta/cofre.

3. VALORES ELETRÔNICOS

Pix + cartão de crédito + cartão de débito + transferência.

Nunca somar valores eletrônicos ao dinheiro físico.

---

# 32. ORDEM DE IMPLEMENTAÇÃO

1. Backup dos arquivos ativos.
2. Modelo ConferenciaCaixa.
3. Schema.
4. Migração/criação da tabela.
5. Cálculo por forma de pagamento.
6. Endpoint de conferência.
7. Ajuste do fechamento.
8. Ajuste do Caixa.jsx.
9. Ajuste do Caixa.css.
10. Testes da API.
11. Testes da interface.
12. Testes Financeiro -> Caixa.
13. Build.
14. Commit.

NÃO apagar arquivos .backup-* existentes.

NÃO substituir o projeto inteiro.

NÃO apagar dados do banco.

NÃO alterar a integração existente sem preservar compatibilidade.

