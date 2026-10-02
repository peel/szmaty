# Gdzie wyrzucić — szmaty i elektronika w Pomorskiem

Nagłówek pozwala wybrać frakcję: szmaty lub elektronika. Link „Źródła i dokładność” w stopce opisuje aktualnie wybraną frakcję. Eksport CSV, GeoJSON i KML obejmuje wybraną frakcję i wykaz; zapis HTML zachowuje wszystkie dane obu frakcji.

Przy otwarciu mapa jednorazowo prosi przeglądarkę o lokalizację. Po uzyskaniu zgody i pozycji przybliża okolicę użytkownika (zoom 15). Odmowa, błąd, przekroczenie limitu 15 sekund lub brak obsługi lokalizacji powodują pokazanie całego wybranego wykazu. Podczas oczekiwania mapa pozostaje dostępna. Przycisk lokalizacji pozwala ponowić próbę.

Elektronika: 137 wpisów operatora Elektryczne Śmieci z Pomorskiego oraz osobno 90 wpisów miejskiej mapy Gdańska, pobranych 2 października 2026. Wybór wykazu znajduje się pod wyborem frakcji. Listy częściowo się pokrywają, więc nie są sumowane jako unikalne pojemniki. Współrzędne pochodzą bezpośrednio z map źródłowych, bez weryfikacji w terenie. Uwagi zachowują wykryte powtórzenia współrzędnych oraz rozbieżności między wykazami. Dane są osadzone w HTML; kopia znajduje się w `elektroodpady_punkty.json`.

Źródła elektroniki:
- https://elektrycznesmieci.pl/mapa-pojemnikow/
- https://czystemiasto.gdansk.pl/dla-mieszkancow/mapa-pojemnikow-na-elektroodpady/

Poniższy opis dotyczy frakcji szmaty.

Mapa obejmuje wszystkie 1217 wierszy z wykazu PDF. Po połączeniu powtórzeń w tej samej miejscowości, gminie i powiecie zawiera 1090 opisów lokalizacji: 548 dopasowanych adresów, 308 pozycji orientacyjnych i 234 opisy bez współrzędnych. Nie potwierdza aktualnej obecności pojemników.

Współrzędne zapisano bezpośrednio w `index.html`; kopia znajduje się w `pomorskie_punkty.json`, a opisy i numery wierszy źródłowych w `pomorskie_lokalizacje.json`. Mapa nie pobiera współrzędnych przy uruchomieniu. Internet jest potrzebny do podkładu OpenStreetMap. Filtry obejmują powiat, miejscowość i dokładność dopasowania. Eksport CSV, GeoJSON i KML działa lokalnie; CSV jest też dostępny jako `pomorskie_pojemniki.csv`.

Źródło wykazu: https://s-trojmiasto.pl/download/pojemniki-pomorskie.pdf (wiersze 1–1217, strony 1–18 oraz kontynuacja adresu wiersza 709 na stronie 29). Wiersze 958–961 nie mają adresu; każdy pozostaje osobnym wpisem. Oryginalne nazwy i literówki zachowano, a rozpoznane korekty do dopasowania opisano w uwagach. Niejednoznacznych opisów nie zastępowano środkiem miejscowości.

Dopasowanie wykonano jednorazowo do danych OSM pobranych powiatami 1 października 2026. Najstarsza partia: 2026-10-01T17:37:51Z. Wcześniej zapisane pozycje Gdańska zachowano; plik `gdansk_punkty.json` pozostaje archiwalną kopią tego podzbioru.
Dane geograficzne © OpenStreetMap contributors, ODbL: https://www.openstreetmap.org/copyright.

Publikacja: GitHub Pages, gałąź `main`, katalog główny. Domena: `szmaty.peelosophy.com`.
Repozytorium, opublikowana mapa i jej dane są publiczne.
