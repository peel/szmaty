# Gdzie wyrzucić — szmaty i elektronika w Pomorskiem

Nagłówek pozwala wybrać frakcję: szmaty lub elektronika. Link „Źródła i dokładność” w stopce opisuje aktualnie wybraną frakcję. Zapis HTML zachowuje wszystkie dane obu frakcji.

Szczegóły punktu pokazują adres, miejscowość, dostępne wskazówki umiejscowienia oraz zakres dokładności. Nie odnoszą się do PDF ani numerów wierszy. Przycisk „Street View okolicy” otwiera najbliższą dostępną panoramę w Google Maps na podstawie zapisanych współrzędnych (Maps URLs, bez klucza API). Zdjęcie nie potwierdza obecności pojemnika. Punkty bez współrzędnych oferują wyszukiwanie adresu; lokalizacje obejmujące całą ulicę nie dostają trasy do przypadkowego punktu. Test `tests/popup.cjs` sprawdza wszystkie 1233 opisy i linki.

Przy otwarciu mapa jednorazowo prosi przeglądarkę o lokalizację. Po uzyskaniu zgody i pozycji przybliża okolicę użytkownika (zoom 15). Przełączenie frakcji wraca do tej pozycji i przybliżenia bez ponownego pobierania lokalizacji. Gdy pozycja nie jest znana, pokazuje cały wybrany wykaz. Odmowa, błąd, przekroczenie limitu 15 sekund lub brak obsługi lokalizacji powodują pokazanie całego wybranego wykazu. Podczas oczekiwania mapa pozostaje dostępna. Przycisk lokalizacji pozwala ponowić próbę. Otwarcie punktu zapamiętuje bieżące położenie i przybliżenie mapy; zamknięcie szczegółów (krzyżykiem lub Escape) je przywraca. Przechodzenie między punktami zachowuje widok sprzed pierwszego otwarcia, a zmiana frakcji zeruje ten zapis.

Elektronika: jedna lista **143 miejsc z 227 wpisów źródłowych** (137 wpisów operatora Elektryczne Śmieci z Pomorskiego i 90 wpisów miejskiej mapy Gdańska), pobranych 2 października 2026. Usunięto 84 powtórzenia w 82 scalonych grupach. Liczba miejsc po scaleniu nie jest zweryfikowaną liczbą fizycznych pojemników ani pełnym spisem województwa.

Deduplicacja porównuje miejscowość, znormalizowany adres i odległość. Ten sam adres może być scalony przy przesunięciu do 50 m; opisy tej samej ulicy z różnymi numerami — przy pozycjach do 5 m od siebie, z zachowaniem obu opisów i uwagą. Normalizacja pomija prefiksy ulic, odstępy, interpunkcję, polskie znaki i rozpoznane warianty Kaczyńskiego / Lecha Kaczyńskiego oraz Jagielońska / Jagiellońska. Automatyczne scalenie nie tworzy grup o rozpiętości większej niż 50 m. Sama bliskość różnych ulic nie wystarcza.

Cztery decyzje opisane w `metadata.reviewed`: dwa cmentarze (zgodne współrzędne, nazwa obiektu zamiast adresu), Kartuska 459 / 459C (wariant numeru, ok. 22 m) oraz Karpacka 2 (sprzeczne pozycje operatora, wybrano współrzędne zgodne z mapą miejską). Jeleniogórska / Flisykowskiego pozostają osobno mimo identycznych pozycji; Fabryczna / Kartuska pozostają osobno mimo niewielkiej odległości. Te przypadki wymagają potwierdzenia w terenie.

Współrzędne zachowano z jednego z oryginalnych wpisów, bez uśredniania. W szczegółach każdego miejsca dostępne są wszystkie źródła, adresy i współrzędne. Wyszukiwanie obejmuje warianty adresu; zapis HTML zachowuje pochodzenie danych. JSON zawiera oryginalne tablice `operator` i `city`, połączoną `points` oraz `metadata`. HTML zawiera gotową listę i nie pobiera ani nie scala danych podczas uruchamiania.

Odtworzenie listy: `node scripts/build-electronics.cjs`. Kontrola danych: `node tests/electronics.cjs`. Testy przeglądarkowe `tests/fractions.cjs` i `tests/startup-location.cjs` wymagają Playwright oraz Chrome.
Źródła elektroniki:
- https://elektrycznesmieci.pl/mapa-pojemnikow/
- https://czystemiasto.gdansk.pl/dla-mieszkancow/mapa-pojemnikow-na-elektroodpady/

Poniższy opis dotyczy frakcji szmaty.

Mapa obejmuje wszystkie 1217 wierszy z wykazu PDF. Po połączeniu powtórzeń w tej samej miejscowości, gminie i powiecie zawiera 1090 opisów lokalizacji: 548 dopasowanych adresów, 308 pozycji orientacyjnych i 234 opisy bez współrzędnych. Nie potwierdza aktualnej obecności pojemników.

Współrzędne zapisano bezpośrednio w `index.html`; kopia znajduje się w `pomorskie_punkty.json`, a opisy i numery wierszy źródłowych w `pomorskie_lokalizacje.json`. Mapa nie pobiera współrzędnych przy uruchomieniu. Internet jest potrzebny do podkładu OpenStreetMap. Wyszukiwarka filtruje listę i punkty po adresie, miejscowości, powiecie oraz wariantach opisu. Wybór frakcji pozostaje osobno. Archiwalny CSV z wykazem tekstyliów znajduje się w `pomorskie_pojemniki.csv`.

Źródło wykazu: PDF „pojemniki-pomorskie” udostępniony przez Trójmiasto.pl (wiersze 1–1217, strony 1–18 oraz kontynuacja adresu wiersza 709 na stronie 29). Wiersze 958–961 nie mają adresu; każdy pozostaje osobnym wpisem. Oryginalne nazwy i literówki zachowano, a rozpoznane korekty do dopasowania opisano w uwagach. Niejednoznacznych opisów nie zastępowano środkiem miejscowości.

Dopasowanie wykonano jednorazowo do danych OSM pobranych powiatami 1 października 2026. Najstarsza partia: 2026-10-01T17:37:51Z. Wcześniej zapisane pozycje Gdańska zachowano; plik `gdansk_punkty.json` pozostaje archiwalną kopią tego podzbioru.
Dane geograficzne © OpenStreetMap contributors, ODbL: https://www.openstreetmap.org/copyright.

Publikacja: GitHub Pages, gałąź `main`, katalog główny. Domena: `szmaty.peelosophy.com`.
Repozytorium, opublikowana mapa i jej dane są publiczne.
