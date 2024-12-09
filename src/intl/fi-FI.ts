export default {
	// messages in the top bar of the app
	top_bar: {
		stellar_maps: 'StellarMaps',
		download_latest_release: 'Lataa Viimeisin Julkaisu',
	},
	// messages in the side bar (save selection and map settings)
	// note: messages for specific settings are in the 'setting' and 'option' sections
	side_bar: {
		save_game: 'Tallenne', // header above controls to select save
		refresh_saves_button: 'Virkistä',
		select_manually_button: 'Valitse Manuaalisesti',
		select_save_placeholder: 'Valitse Tallenne...',
		load_save_button: 'Avaa Tallenne',
		map_settings: 'Kartan Asetukset',
		save_settings_button: 'Tallenna',
		load_settings_button: 'Avaa',
		custom_setting_profiles: 'Muokattu',
		preset_setting_profiles: 'Esiasetukset',
		apply_changes_button: 'Suorita Muutokset',
	},
	// messages in the main map section
	map: {
		select_save: 'Valitse tallenne vasemmasta yläkulmasta',
		loading: 'Tämä voi kestää muutaman sekunnin',
		error: 'Jotain on mennyt pieleen',
		click_to_view_system: 'Paina avataksesi kartan',
		tooltip: {
			colonies: 'Siirtokunnat',
		},
	},
	// various generic messages
	generic: {
		NEVER: 'TÄMÄ ON VIRHE', // this message will never be displayed
		enabled: 'Otettu käyttöön',
		disabled: 'Poistettu käytöstä',
		back_button: 'Takaisin',
		cancel_button: 'Peruuta',
		close_button: 'Sulje',
		loading: 'Lataa...',
		confirmation: 'Oletko varma?',
	},
	// various confirmation popups
	confirmation: {
		unsaved_setting_profile:
			'Sinulla on tallentamattomia kartan muunnoksia. Nämä muutokset menetetään.',
		delete_setting_profile: 'Sinä aiot poistaa "{name}". Tätä ei voi kumota.',
	},
	// various prompt popups
	prompt: {
		enter_settings_profile_name: 'Kirjoita nimi',
		select_save_file: 'Valitse Tallenne',
		select_save_file_filter_name: 'Stellaris Tallenne',
		select_stellaris_install: 'Valitse Stellariksen Asennuskansio',
	},
	// input validation messages
	validation: {
		required: 'Pakollinen',
		min: 'Pienin: {min, number}',
		max: 'Suurin: {max, number}',
		min_max: 'Pienin: {min, number}, Suurin: {max, number}',
	},
	// various notification popups
	notification: {
		settings_profile_saved: '"{name}" asetukset tallennettu',
		failed_to_load_save_list: 'Stellaris tallenteiden avaaminen epäonnistui',
		failed_to_load_save_file: 'Avaaminen epäonnistui {filePath}',
		export_success: 'Tulostaminen Onnistui',
		export_failed: 'Tulostaminen Epäonnistui',
		failed_to_load_stellaris_data: {
			title: 'Stellaris datan avaaminen epäonnistui',
			description:
				'Yritä asennuskansion manuaalista valitsemista. Tämän pitäisi olla kansio, joka sisältää "common", "flags" ja "localisation" kansiot (muiden muassa).',
			action: 'Valitse Asennus',
		},
	},
	// messages for the export button and popup
	export: {
		button: 'Tulosta',
		header: 'Tulosta Kuva',
		image_size: 'Kuvan Koko',
		lock_aspect_ratio: 'Lukitse Kuvasuhde',
		zoom: 'Suurenna',
		center: 'Keskitä',
		center_hint: '(Galaksi on noin 1000 yksikköä päästä päähän.)',
		preview: 'Esikatsele:',
		click_to_center: '(Paina keskittääksesi)',
		reset_button: 'Nollaa',
		export_svg_button: 'Tulosta SVG',
		export_png_button: 'Tulosta PNG',
		processing: 'Käsitellään...',
	},
	// messages in the app settings popup
	app_settings: {
		title: 'Asetukset',
		description: 'Kaikki muutokset tallennetaan ja otetaan käyttöön automaattisesti.',
		select_translator_mode_file: 'Valitse Käännöstiedosto',
		translator_mode_no_file: 'Tiedostoa ei ole valittu',
		translator_mode_file: 'Tarkastellaan {filePath}',
		translator_mode_untranslated_messages: 'Kääntämättömiä viestejä: {number, number}',
		translator_mode_extra_messages: 'Virheellinen viestin ID: {number, number}',
	},
	// labels for various types of setting controls
	// (shared by multiple settings)
	control: {
		color: {
			label: 'Väri',
			adjustment: {
				header: 'Värien Säätäminen',
				add_button: '+ Lisää Muutos',
				placeholder: 'Valitse tyyppi...',
			},
		},
		icon: {
			label: 'Kuvake',
			size: 'Koko',
			advanced_options: {
				header: 'Lisäasetukset',
				position: 'Asento',
				priority: 'Tärkeys',
			},
		},
		stroke: {
			width: 'Leveys',
			more_styles: {
				header: 'Lisää Tyylejä',
				smoothed: 'Tasoitettu',
				glow: 'Hehkuva',
				dashed: 'Katkoviivattu',
				dash_pattern: 'Kuvioitu',
				dash_pattern_tooltip:
					'Katkoviivainen lista, joka kuvastaa katkoviivojen välin ja koon. Esimerkiksi, "3 1" On 3:n pituinen viiva jota seuraa 1:den kokoinen kolo. Voit käyttää pidempiä listoja monimutkaisempien kuvioiden laatimiseen.',
			},
		},
	},
	// dropdown options for various settings
	option: {
		color: {
			group: {
				dynamic: 'Dynaamiset Värit',
				stellaris: 'Stellaris Värit',
				stellar_maps: 'StellarMaps Värit',
			},
			primary: 'Pääväri',
			secondary: 'Korostusväri',
			border: 'Raja',
		},
		color_adjustment: {
			LIGHTEN: 'Kirkasta',
			DARKEN: 'Tummenna',
			MIN_LIGHTNESS: 'Pienin Kirkastus',
			MAX_LIGHTNESS: 'Suurin Kirkastus',
			MIN_CONTRAST: 'Pienin Kontrasti',
			OPACITY: 'Läpinäkyvyys',
		},
		icon: {
			group: {
				basic_shape: 'Yleiset Muodot',
				stars: 'Tähdet',
				other_shapes: 'Muut Muodot',
				stellaris: 'Stellaris',
			},
			triangle: 'Kolmio',
			triangle_flat: 'Kolmio (Tasainen huippu)',
			diamond: 'Timantti',
			square: 'Neliö',
			pentagon: 'Viisikulmio',
			pentagon_flat: 'Viisikulmio (Tasainen huippu)',
			hexagon: 'Kuusikulmio',
			hexagon_flat: 'Kuusikulmio (Tasainen huippu)',
			heptagon: 'Seitsenkulmio',
			heptagon_flat: 'Seitsenkulmio (Tasainen huippu)',
			octagon: 'Kahdeksankulmio',
			octagon_flat: 'Kahdeksankulmio (Tasainen huippu)',
			circle: 'Ympyrä',
			star_3_pointed: '3-Sakarainen Tähti',
			star_4_pointed: '4-Sakarainen Tähti',
			star_5_pointed: '5-Sakarainen Tähti',
			star_6_pointed: '6-Sakarainen Tähti',
			star_7_pointed: '7-Sakarainen Tähti',
			star_8_pointed: '8-Sakarainen Tähti',
			cross: 'Risti',
			wormhole: 'Madonreikä',
			gateway: 'Porttikäytävä',
			l_gate: 'L-Käytävä',
			shroud_tunnel: 'Shroud Tunneli (epävirallinen)',
		},
		icon_position: {
			center: 'Keskitetty',
			left: 'Vasen',
			right: 'Oikea',
			top: 'Ylä',
			bottom: 'Ala',
		},
		glyph: {
			none: 'Tyhjä',
			star_4_pointed: '✦ 4-Sakarainen Tähti',
			star_4_pointed_outline: '✧ 4-Sakarainen Tähti (ääriviivat)',
			star_5_pointed: '★ 5-Sakarainen Tähti',
			star_5_pointed_outline: '☆ 5-Sakarainen Tähti (ääriviivat)',
			star_5_pointed_circled: '✪ 5-Sakarainen Tähti (ympyröity)',
			star_5_pointed_pinwheel: '✯ 5-Sakarainen Tähti (väkkärä)',
			star_6_pointed: '✶ 6-Sakarainen Tähti',
			star_8_pointed: '✴ 8-Sakarainen Tähti',
		},
		union: {
			joined_borders: 'Sama Väri, Yhdistetyt Rajat',
			separate_borders: 'Sama Väri, Eritellyt Rajat',
			off: 'Pois Päältä',
		},
		union_federations_color: {
			founder: 'Perustaja',
			leader: 'Nykyinen Johtaja',
		},
		country_names_type: {
			country_only: 'Vain Valtion Nimi',
			player_only: 'Vain Pelaajan Nimi',
			country_then_player: 'Valtion- sitten Pelaajan Nimi',
			player_then_country: 'Pelaajan- sitten Valtion Nimi',
		},
		labels_avoid_holes: {
			all: 'Kaikki',
			owned: 'Omistetut',
			none: 'Ei Mitään',
		},
		country: {
			player: 'Pelaaja',
		},
		terra_incognita_style: {
			flat: 'Tasainen',
			striped: 'Raidallinen',
			cloudy: 'Pilvinen',
		},
		system_names: {
			none: 'Ei Mitään',
			country_capitals: 'Valtioiden Pääkaupungit',
			sector_capitals: 'Valtioden ja Sektoreiden Pääkaupungit',
			colonized: 'Asutetut Aurinkokunnat',
			all: 'Kaikki Aurinkokunnat',
		},
		system_map_label_position: {
			top: 'Ylä',
			bottom: 'Ala',
			right: 'Oikea',
			left: 'Vasen',
			orbit: 'Ympäröivä',
		},
	},
	// labels and tooltips for various settings
	setting: {
		group: {
			borders: 'Rajat',
			unions: 'Liitot Tila',
			occupation: 'Miehitys',
			countryLabels: 'Valtioiden Nimet',
			systemLabels: 'Aurinkokuntien Nimet',
			systemIcons: 'Aurinkokuntien Kuvakkeet',
			hyperlanes: 'Hyperkaistat',
			bypassLinks: 'Ohita Yhteydet',
			terraIncognita: 'Terra Incognita',
			misc: 'Epämääräiset',
			advancedBorder: 'Rajojen Lisäasetukset',
			starscape: 'Tähtimaisema',
			legend: 'Selite',
			solarSystemMap: 'Aurinkokunta Kartta',
		},
		mapMode: 'Kartta Tila',
		mapModePointOfView: 'Näkökulma',
		mapModePointOfView_tooltip: `<ul>
			<li><strong>VAROITUS</strong>: Tämän vaihtaminen voi paljastaa tietoa, jota et voit normaalisti nähdä. Vältä jos haluat "puhtaan" kokemuksen.</li>
			<li>Vinkki: <strong>shift+click</strong> Valtion kohdalla, jonka näkökulmaan haluat vaihtaa.</li>
		</ul>`,
		mapModeSpecies: 'Lajit',
		borderStroke: 'Valtioden Rajat',
		borderColor: 'Valtioden Rajojen Värit',
		borderFillColor: 'Valtioiden Täyttöväri',
		borderFillFade: 'Valtion Täyttövärin Haalistus',
		borderFillFade_tooltip: `<ul>
			<li>Lisää haalistus tehosteen rajan läheisyyteen.</li>
			<li>Väri alkaa rajalta 100% läpinäkyydellä.</li>
			<li>Toimii parhaiten, jos valtion täyttövärillä on alhainen läpinäkyvyys.</li>
		</ul>`,
		frontierBubbleThreshold: 'Rajakuplien Kynnystys',
		frontierBubbleThreshold_tooltip: `<ul>
			<li>Rajakuplat piirretään kuten ne olisivat osa viereistä sektoria.</li>
			<li>Rajakuplat ovat pieniä hyperkaistoilla yhdistettyjä rykelmiä sektorittomia aurinkokuntia.</li>
			<li>Tämä asetus määrä kuinka monta aurinkokuntaa voi maksimissaan olla rajakuplassa.</li>
			<li>Jätä tyhjäksi tai aseta arvoksi 0 poistaaksesi asetuksen päältä.</li>
		</ul>`,
		sectorTypeBorderStyles: 'Erottuvat Sektori Tyyppi Tyylit',
		sectorTypeBorderStyles_tooltip:
			'Lisää eritellys tyyli asetukset Ydin- ja Reunasektoreiden rajoille.',
		sectorBorderStroke: 'Sektoreiden Rajat',
		sectorBorderColor: 'Sektoreiden Rajojen Väri',
		sectorCoreBorderStroke: 'Ydinsektoreiden Rajat',
		sectorCoreBorderColor: 'Ydisekstoreiden Rajojen Väri',
		sectorFrontierBorderStroke: 'Reunasektoreiden Rajat',
		sectorFrontierBorderColor: 'Reunasektoreiden Rajojen Väri',
		unionBorderStroke: 'Liittojen Yhdistetyt Rajat',
		unionBorderColor: 'Liittojen Yhdistettyjen Rajojen Väri',
		unionMode: 'Liitto Tila',
		unionSubjects: 'Alaisvaltiot',
		unionHegemonies: 'Hegemoonia Liitot',
		unionFederations: 'Muut Liitot',
		unionFederationsColor: 'Liiton Jäsenten Väri',
		unionLeaderSymbol: 'Liiton Johtajan Merkki',
		unionLeaderSymbolSize: 'Liiton Johtajan Merkin Koko',
		unionLeaderUnderline: 'Alleviivaa Liiton Johtajan Nimi',
		occupation: 'Miehitys',
		occupationColor: 'Miehityksen Väri',
		countryNames: 'Nimet',
		countryNamesType: 'Nimien Tyyppi',
		countryNamesMinSize: 'Nimen Pienin Koko',
		countryNamesMinSize_tooltip: 'Jos tämä koko ei mahdu, niin nimeä ei piirretä.',
		countryNamesMaxSize: 'Nimen Suurin Koko',
		countryNamesMaxSize_tooltip: 'Nimeä ei piirretä tätä kokoa suuremmaksi, vaikka olisikin tilaa.',
		countryNamesSecondaryRelativeSize: 'Toissijaisen Nimen Suhteellinen Koko',
		countryNamesFont: 'Fontti',
		countryEmblems: 'Merkit',
		countryEmblemsMinSize: 'Merkin Pienin Koko',
		countryEmblemsMinSize_tooltip: 'Jos tämä koko ei mahdu, niin merkkiä ei piirretä.',
		countryEmblemsMaxSize: 'Merkin Suurin Koko',
		countryEmblemsMaxSize_tooltip:
			'Merkkiä ei piirretä tätä kokoa suuremmaksi, vaikka olisikin tilaa.',
		labelsAvoidHoles: 'Vältä Rakoja Rajoissa',
		systemNames: 'Aurinkokuntien Nimet',
		systemNamesFont: 'Fontti',
		systemNamesFontSize: 'Fontin koko',
		countryCapitalIcon: 'Valtion Pääkaupunki',
		sectorCapitalIcon: 'Sektorin Pääkaupunki',
		populatedSystemIcon: 'Asutettu Aurinkokunta',
		unpopulatedSystemIcon: 'Muut Aurinkokunnat',
		wormholeIcon: 'Madonreijät',
		gatewayIcon: 'Porttikäytävät',
		lGateIcon: 'L-Portit',
		shroudTunnelIcon: 'Shroud Tunnelit',
		hyperlaneStroke: 'Hyperkaistat',
		hyperlaneColor: 'Hyperkaistojen Väri',
		unownedHyperlaneColor: 'Omistamattomien Hyperkaistojen Väri',
		hyperRelayStroke: 'Hypervälittimet',
		hyperRelayColor: 'Hypervälittimien Värit',
		unownedHyperRelayColor: 'Omistamattomien Hypervälittimien Väri',
		hyperlaneMetroStyle: 'Metrotyyliset Hyperkaistat',
		hyperlaneMetroStyle_tooltip: `<ul>
			<li>Piirtää hyperkaistat metrokarttojen kaltaisesti.</li>
			<li>Automaattisesti Ottaa Käyttöön "Aurinkokuntien Tasaaminen Ruudukkoon" Asetuksen.</li>
		</ul>`,
		wormholeStroke: 'Madonreikien Yhteydet',
		wormholeStrokeColor: 'Madonreikien Yhteyksien Väri',
		lGateStroke: 'L-Porttien Yhteydet',
		lGateStrokeColor: 'L-Portti Yhteyksien Väri',
		shroudTunnelStroke: 'Shroud Tunneleiden Yhteydet',
		shroudTunnelStrokeColor: 'Shroud Tunneleiden Yhteyksien Väri',
		terraIncognita: 'Terra Incognita',
		terraIncognitaPerspectiveCountry: 'Näkökulmana Toimiva Valtio',
		terraIncognitaStyle: 'Tyyli',
		terraIncognitaBrightness: 'Kirkkaus',
		backgroundColor: 'Taustan Väri',
		alignStarsToGrid: 'Aurinkokuntien Tasaaminen Ruudukkoon',
		circularGalaxyBorders: 'Pyöreät Galaksin Rajat',
		circularGalaxyBorders_tooltip: `<ul>
			<li>Kun tämä asetus on päällä, galaksin ulkorajat ovat ympyrän muotoisia ja aurinkokuntien välissä ei tule olemaan reikiä.</li>
			<li>Jos galaksin malliksi on valittu "Starburst", niin normaalin ympyrän sijasta käytetään erilaista kierre mallia.</li>
		</ul>`,
		borderGap: 'Raja Väli',
		borderGap_tooltip: 'Lisää tyhjän tilan valtioiden rajojen väliin',
		hyperlaneSensitiveBorders: 'Hyperkaistoja Tarkasti Seuraavat Rajat',
		hyperlaneSensitiveBorders_tooltip: `<ul>
			<li>Kuin tämä asetus on päällä, rajat seuraavat hyperkaistoja.</li>
			<li>Kuin tämä asetus on pois päältä, vain aurinkokunnat vaikuttavat rajoihin.</li>
			<li>Asetusta ei ole tuettu jos seuraavat asetukset olevat päällä:
				<ul>
					<li>Metrotyyliset Hyperkaistat</li>
					<li>Aurinkokuntien Tasaaminen Ruudukkoon</li>
				</ul>
			</li>
		</ul>`,
		voronoiGridSize: 'Voronoi Ruudukon Koko',
		voronoiGridSize_tooltip: `<ul>
			<li>Suuremmat arvot tekevät rajoista "löysempiä".</li>
			<li>Alhaisemmat arvot tekevät rajoista "tiukempia".</li>
			<li>Alhaisemmissa arvoissa kestää kauemmin käsitellä.</li>
			<li><strong>VAROITUS</strong>: 10:tä alhaisemmissa arvoissa voi kestää huomattavan kauan käsitellä.</li>
		</ul>`,
		claimVoidMaxSize: 'Tyhjän Alueen "Omistamisen" Suurin Ulotus',
		claimVoidMaxSize_tooltip: `<ul>
			<li>Jos kartalla on tyhjää tilaa, niin sitä naapuroiva valtio voi "omistaa" tätä tilaa kartassa.</li>
			<li>Naapuroiva valtio voi "omistaa" tyhjän tilan vain jos se on tätä arvoa pienempi.</li>
			<li>Jos asetat arvoksi 0 tai jätät kentän tyhjäksi, niin tämä käyttätyminen poistetaan käytöstä.</li>
		</ul>`,
		claimVoidBorderThreshold: 'Valitse Tyhjän Tilan "Omistamiselle" Rajoitus',
		claimVoidBorderThreshold_tooltip: `<ul>
			<li>Jos kartalla on tyhjää tilaa, niin sitä naapuroiva valtio voi "omistaa" tätä tilaa kartassa.</li>
			<li>Jotta valtio voi "omistaa" tyhjää tilaa, täytyy sen omistaa vähintään tämän verran rajaa sen kanssa.</li>
			<li>Aseta täydelle, jotta vain täysin piiritetty tyhjä tila merkitään "omistetuksi".</li>
			<li>Aseta tyhjäksi, jotta kaikki valtioita naapuroiva tyhjä tila merkitään "omistetuksi".</li>
		</ul>`,
		starScapeDust: 'Pöly',
		starScapeDustColor: 'Pölyn Väri',
		starScapeNebula: 'Tähtisumu',
		starScapeNebulaColor: 'Tähtisumun Väri',
		starScapeNebulaAccentColor: 'Tähitsumun Korosteväri',
		starScapeCore: 'Ydin',
		starScapeCoreColor: 'Ytimen Väri',
		starScapeCoreAccentColor: 'Ytimen Korostusväri',
		starScapeStars: 'Tähdet',
		starScapeStarsColor: 'Tähtien Väri',
		starScapeStarsCount: 'Tähtien Määrä',
		legend: 'Selite',
		legendFontSize: 'Fontin Koko',
		legendBorderStroke: 'Rajaus',
		legendBorderColor: 'Rajauksen Väri',
		legendBackgroundColor: 'Taustaväri',
		systemMapOrbitStroke: 'Kiertoradan Viivat',
		systemMapOrbitColor: 'Kierotratojen Viivojen Väri',
		systemMapPlanetScale: 'Planeettojen Mittakaava',
		systemMapLabelPlanetsFont: 'Planeettojen Nimien Fontti',
		systemMapLabelPlanetsFontSize: 'Planeettojen Nimien Fonttien Koko',
		systemMapLabelPlanetsPosition: 'Planeettojen Nimien Sijoitus',
		systemMapLabelPlanetsFallbackPosition: 'Planeettojen Nimien Vara Sijoitus',
		systemMapLabelColoniesEnabled: 'Siirtokuntien Nimet',
		systemMapLabelStarsEnabled: 'Tähtien Nimet',
		systemMapLabelPlanetsEnabled: 'Planeettojen Nimet',
		systemMapLabelMoonsEnabled: 'Kuiden Nimet',
		systemMapLabelAsteroidsEnabled: 'Asteroidien Nimet',
		systemMapHyperlanesEnabled: 'Hyperkaistojen Yhteydet',
		appLocale: 'StellarMapsin Kieli',
		appLocale_tooltip:
			'Liity Discord palvelimelle (Linkki yläpalkissa) Jos haluat avustaa kääntämissessä!',
		appStellarisLanguage: 'Stellariksen Kieli',
		appStellarisLanguage_tooltip:
			'Kieli jota käytetään Stellariksen tiedostoista tulevissa teksteissä (kuten valtiot, aurinkokunnat, ja planeettojen nimet).',
		appTranslatorMode: 'Kääntäjä Tila',
		appTranslatorMode_tooltip: `
		<strong>StellarMapsin Kääntäjille:</strong>
		<ul>
			<li>Paina AlT näppäintä pohjaan nähdäksesi viestin IDt.</li>
			<li>Valitse käännös tiedosto jota viesteissä tulisi käyttää.</li>
			<li>Lataa viestit uudelleen kuin tiedostoa muokataan.</li>
			<li>Esittää varoituksia puutuuvista- ja lisättävistä viesteistä.</li>
			<li>Sinun täytyy valita tiedosto uudelleen jos avaat sovelluksen uudestaan.</li>
		</ul>`,
	},
	map_mode: {
		common: {
			selected_country: 'Valittu Valtio',
		},
		default: {
			name: 'Valtiot',
		},
		unions: {
			name: 'Liittoumat',
		},
		wars: {
			name: 'Sodat',
			tooltip_label: 'Sotien Asema',
			hostile: 'Vihamielinen',
			ally: 'Liittolainen Aktiivisessa Sodassa',
			at_war: 'Sodassa (Olematta Mukana)',
			at_peace: 'Rauhassa',
		},
		population: {
			name_total: 'Kokonais Väkiluku',
			name_by_country: 'Väkiluvut Valtioittain',
			name_species: 'Lajien Väkiluvut',
			tooltip_label: 'Väkiluku',
			total: 'Kokonais Väkiluku',
			country: 'Väkiluku (Väritetty Valtioiden Mukaan)',
			free_species: 'Vapaat {species}',
			enslaved_species: 'Orjuutetut {species}',
			other_species: 'Muut Lajit',
		},
		fleet_power: {
			name_allied_and_hostile: 'Liittoutuneiden ja Vihamielisten Laiavastoiden Voimatasot',
			tooltip_label: 'Laivaston Voimataso',
			own_fleet: 'Oma Laivasto',
			own_station: 'Oma Avaruusasema',
			allied_fleet: 'Liittolaisen Laivasto',
			allied_station: 'Liittolaisen Avaruusasema',
			hostile_fleet: 'Vihamielinen Laivasto',
			hostile_station: 'Vihamielinen Avaruusasema',
		},
		trade_routes: {
			name: 'Kauppareitit',
			tooltip_label: 'Kaupan Arvo',
			collected: 'Kerätty Arvo',
			pass_through: 'Arvo, Joka on Kulkenut Läpi',
			pirated: 'Varastettu Arvo',
		},
		authority: {
			name: 'Valtionmuodot',
			tooltip_label: 'Valtionmuodot',
		},
		relations: {
			name: 'Suhteet',
			tooltip_label: 'Suhteet',
		},
	},
	legend: {
		fully_occupied: 'Täysin Miehitettu',
		partially_occupied: 'Osittain Miehitetty',
	},
};
