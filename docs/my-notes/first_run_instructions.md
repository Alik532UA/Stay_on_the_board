1. скачати ollama
2. встановити модель, в командний рядок написати: ollama pull nomic-embed-text

3. скачати docker-desktop
4. в командний рядок написати: docker run -p 6333:6333 qdrant/qdrant

5. в Roo Code увімкнути Codebase Indexing
6. Embedder Provider: Ollama
7. Ollama Base URL: http://localhost:11434
8. Model: nomic-embed-text
9. Qdrant URL: http://localhost:6333
10. Qdrant API Key: (порожне поле)

11. в Roo Code зайти в налаштування Provider
12. Активувати Use custom base URL, заповнити поле: http://127.0.0.1:5000

---

## Інструкція з налаштування Roo Code для першого запуску

Ця інструкція допоможе налаштувати необхідні інструменти для роботи Roo Code з локальною моделлю та векторною базою даних.

### Крок 1: Встановлення Ollama та необхідної моделі

1.  Завантажте та встановіть **Ollama** з [офіційного сайту](https://ollama.com/).
2.  Після встановлення, відкрийте термінал (командний рядок) та виконайте команду для завантаження моделі `nomic-embed-text`:
    ```bash
    ollama pull nomic-embed-text
    ```

### Крок 2: Встановлення Docker та запуск Qdrant

1.  Завантажте та встановіть **Docker Desktop** з [офіційного сайту](https://www.docker.com/products/docker-desktop/).
2.  Відкрийте термінал і виконайте наступну команду, щоб запустити контейнер **Qdrant**:
    ```bash
    docker run -p 6333:6333 qdrant/qdrant
    ```
    Це запустить Qdrant, який буде доступний за адресою `http://localhost:6333`.

### Крок 3: Налаштування Roo Code

#### 3.1. Налаштування індексації кодової бази (Codebase Indexing)

1.  У налаштуваннях Roo Code увімкніть **Codebase Indexing**.
2.  Заповніть поля наступним чином:
    *   **Embedder Provider:** `Ollama`
    *   **Ollama Base URL:** `http://localhost:11434`
    *   **Model:** `nomic-embed-text`
    *   **Qdrant URL:** `http://localhost:6333`
    *   **Qdrant API Key:** (залиште поле порожнім)

#### 3.2. Налаштування провайдера (Provider)

1.  Перейдіть до налаштувань **Provider** у Roo Code.
2.  Активуйте опцію **Use custom base URL**.
3.  У полі, що з'явилося, введіть `http://127.0.0.1:5000`.