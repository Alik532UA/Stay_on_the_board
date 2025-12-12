# refactor(gameService): Декомпозиція функції makeMove та централізація ініціалізації гри

**Опис:**
Виконано значний рефакторинг gameService.ts для покращення структури та підтримки коду.

Основні зміни включають:
- Декомпозиція монолітної функції `makeMove` на менші, вузькоспеціалізовані приватні функції (`_executeMove`, `_checkForGameOver`, `_handleGameOver`, `_switchPlayer`, `_triggerComputerMove`). Це значно підвищує читабельність, зменшує складність та покращує дотримання принципу єдиної відповідальності (SRP).
- Централізація логіки ініціалізації гри в новій функції `initializeGame`. Функція `resetGame` тепер використовує `initializeGame`, що усуває дублювання коду та забезпечує єдине джерело правди для початкового стану гри.

Ці зміни покращують загальну якість коду, роблять його легшим для тестування та майбутнього розширення, а також підвищують відповідність принципам SOLID.

---

# refactor(gameService): Decompose makeMove function and centralize game initialization

**Description:**
Performed a significant refactoring of gameService.ts to improve code structure and maintainability.

Key changes include:
- Decomposed the monolithic `makeMove` function into smaller, specialized private functions (`_executeMove`, `_checkForGameOver`, `_handleGameOver`, `_switchPlayer`, `_triggerComputerMove`). This significantly enhances readability, reduces complexity, and improves adherence to the Single Responsibility Principle (SRP).
- Centralized game initialization logic into a new `initializeGame` function. The `resetGame` function now utilizes `initializeGame`, eliminating code duplication and ensuring a single source of truth for the initial game state.

These changes improve overall code quality, make it easier to test and extend in the future, and enhance compliance with SOLID principles.
