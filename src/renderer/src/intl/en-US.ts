export default {
	// messages in the top bar of the app
	top_bar: {
		stellar_maps: 'StellarMaps',
		download_latest_release: 'Download Latest Release',
	},
	// messages in the side bar (save selection and map settings)
	// note: messages for specific settings are in the 'setting' and 'option' sections
	side_bar: {
		save_game: 'Save Game', // header above controls to select save
		refresh_saves_button: 'Refresh',
		select_manually_button: 'Select Manually',
		select_save_placeholder: 'Select a save...',
		load_save_button: 'Load Save',
		map_settings: 'Map Settings',
		save_settings_button: 'Save',
		load_settings_button: 'Load',
		custom_setting_profiles: 'Custom',
		preset_setting_profiles: 'Preset',
		apply_changes_button: 'Apply Changes',
	},
	// messages in the main map section
	map: {
		select_save: 'Select a save in the top left',
		loading: 'This could take a few seconds',
		error: 'Something has gone wrong',
	},
	// various generic messages
	generic: {
		enabled: 'Enabled',
		disabled: 'Disabled',
		cancel_button: 'Cancel',
		close_button: 'Close',
		loading: 'Loading...',
		confirmation: 'Are you sure?',
	},
	// various confirmation popups
	confirmation: {
		unsaved_setting_profile:
			'You have customized map settings that have not been saved. These changes will be lost.',
		delete_setting_profile: 'You are about to delete "{name}". This cannot be undone.',
	},
	// various prompt popups
	prompt: {
		enter_settings_profile_name: 'Enter a name',
		select_save_file: 'Select Save',
		select_save_file_filter_name: 'Stellaris Save',
		select_stellaris_install: 'Select Stellaris Install Folder',
	},
	// input validation messages
	validation: {
		required: 'Required',
		min: 'Min: {min, number}',
		max: 'Max: {max, number}',
		min_max: 'Min: {min, number}, Max: {max, number}',
	},
	// various notification popups
	notification: {
		settings_profile_saved: '"{name}" settings saved',
		failed_to_load_save_list: 'Failed to load Stellaris saves',
		failed_to_load_save_file: 'Failed to load {filePath}',
		export_success: 'Export Successful',
		export_failed: 'Export Failed',
		failed_to_load_stellaris_data: {
			title: 'Failed to load Stellaris data',
			description:
				'Please try manually selecting your install location. This should be the folder that contains the "common", "flags", and "localisation" folders (among others).',
			action: 'Select Install',
		},
	},
	// messages for the export button and popup
	export: {
		button: 'Export',
		header: 'Export Image',
		image_size: 'Image Size',
		lock_aspect_ratio: 'Lock Aspect Ratio',
		zoom: 'Zoom',
		center: 'Center',
		center_hint: '(The galaxy is about 1000 units across.)',
		preview: 'Preview:',
		click_to_center: '(Click to center)',
		reset_button: 'Reset',
		export_svg_button: 'Export SVG',
		export_png_button: 'Export PNG',
		processing: 'Processing...',
	},
	// messages in the app settings popup
	app_settings: {
		title: 'Settings',
		description: 'All changes are automatically saved and applied.',
		select_translator_mode_file: 'Select Translation File',
		translator_mode_no_file: 'No file selected',
		translator_mode_file: 'Watching {filePath}',
		translator_mode_untranslated_messages: 'Untranslated messages: {number, number}',
		translator_mode_extra_messages: 'Invalid message IDs: {number, number}',
	},
	// labels for various types of setting controls
	// (shared by multiple settings)
	control: {
		color: {
			label: 'Color',
			adjustment: {
				header: 'Color Adjustments',
				add_button: '+ Add Adjustment',
				placeholder: 'Select type...',
			},
		},
		icon: {
			label: 'Icon',
			size: 'Size',
			advanced_options: {
				header: 'Advanced Options',
				position: 'Position',
				priority: 'Priority',
			},
		},
		stroke: {
			width: 'Width',
			more_styles: {
				header: 'More Styles',
				smoothed: 'Smoothed',
				glow: 'Glow',
				dashed: 'Dashed',
				dash_pattern: 'Pattern',
				dash_pattern_tooltip:
					'A space-separated list determining the length of dashes and gaps. For example, "3 1" is a 3-length dash followed by a 1-length gap. You can use longer lists for complex patterns.',
			},
		},
	},
	// dropdown options for various settings
	option: {
		color: {
			group: {
				dynamic: 'Dynamic Colors',
				stellaris: 'Stellaris Colors',
				stellar_maps: 'StellarMaps Colors',
			},
			primary: 'Primary',
			secondary: 'Secondary',
			border: 'Border',
		},
		color_adjustment: {
			LIGHTEN: 'Lighten',
			DARKEN: 'Darken',
			MIN_LIGHTNESS: 'Min Lightness',
			MAX_LIGHTNESS: 'Max Lightness',
			MIN_CONTRAST: 'Min Contrast',
			OPACITY: 'Opacity',
		},
		icon: {
			group: {
				basic_shape: 'Basic Shapes',
				stars: 'Stars',
				other_shapes: 'Other Shapes',
				stellaris: 'Stellaris',
			},
			triangle: 'Triangle',
			triangle_flat: 'Triangle (flat top)',
			diamond: 'Diamond',
			square: 'Square',
			pentagon: 'Pentagon',
			pentagon_flat: 'Pentagon (flat top)',
			hexagon: 'Hexagon',
			hexagon_flat: 'Hexagon (flat top)',
			heptagon: 'Heptagon',
			heptagon_flat: 'Heptagon (flat top)',
			octagon: 'Octagon',
			octagon_flat: 'Octagon (flat top)',
			circle: 'Circle',
			star_3_pointed: '3-Pointed Star',
			star_4_pointed: '4-Pointed Star',
			star_5_pointed: '5-Pointed Star',
			star_6_pointed: '6-Pointed Star',
			star_7_pointed: '7-Pointed Star',
			star_8_pointed: '8-Pointed Star',
			cross: 'Cross',
			wormhole: 'Wormhole',
			gateway: 'Gateway',
			l_gate: 'L-Gate',
			shroud_tunnel: 'Shroud Tunnel (unofficial)',
		},
		icon_position: {
			center: 'Center',
			left: 'Left',
			right: 'Right',
			top: 'Top',
			bottom: 'Bottom',
		},
		glyph: {
			none: 'None',
			star_4_pointed: '✦ 4-Pointed Star',
			star_4_pointed_outline: '✧ 4-Pointed Star (outline)',
			star_5_pointed: '★ 5-Pointed Star',
			star_5_pointed_outline: '☆ 5-Pointed Star (outline)',
			star_5_pointed_circled: '✪ 5-Pointed Star (circled)',
			star_5_pointed_pinwheel: '✯ 5-Pointed Star (pinwheel)',
			star_6_pointed: '✶ 6-Pointed Star',
			star_8_pointed: '✴ 8-Pointed Star',
		},
		union: {
			joined_borders: 'Same Color, Joined Borders',
			separate_borders: 'Same Color, Separate Borders',
			off: 'Off',
		},
		union_federations_color: {
			founder: 'Founder',
			leader: 'Current Leader',
		},
		country_names_type: {
			country_only: 'Country Name Only',
			player_only: 'Player Name Only',
			country_then_player: 'Country then Player Name',
			player_then_country: 'Player then Country Name',
		},
		labels_avoid_holes: {
			all: 'All',
			owned: 'Owned',
			none: 'None',
		},
		terra_incognita_perspective_country: {
			player: 'Player',
		},
		terra_incognita_style: {
			flat: 'Flat',
			striped: 'Striped',
			cloudy: 'Cloudy',
		},
		system_names: {
			none: 'None',
			country_capitals: 'Country Capitals',
			sector_capitals: 'Country and Sector Capitals',
			colonized: 'Colonized Systems',
			all: 'All Systems',
		},
	},
	// labels and tooltips for various settings
	setting: {
		group: {
			borders: 'Borders',
			unions: 'Union Mode',
			countryLabels: 'Country Labels',
			systemLabels: 'System Labels',
			systemIcons: 'System Icons',
			hyperlanes: 'Hyperlanes',
			bypassLinks: 'Bypass Links',
			terraIncognita: 'Terra Incognita',
			misc: 'Miscellaneous',
			advancedBorder: 'Advanced Border Settings',
			starscape: 'Starscape',
		},
		borderStroke: 'Country Borders',
		borderColor: 'Country Border Color',
		borderFillColor: 'Country Fill Color',
		borderFillFade: 'Country Fill Fade',
		borderFillFade_tooltip: `<ul>
			<li>Adds a fade-out effect at near the border.</li>
			<li>Starts at 100% opacity at the border.</li>
			<li>Works best if Country Fill Color has low opacity.</li>
		</ul>`,
		sectorBorderStroke: 'Sector Borders',
		sectorBorderColor: 'Sector Border Color',
		unionBorderStroke: 'Union Borders',
		unionBorderColor: 'Union Border Color',
		unionMode: 'Union Mode',
		unionSubjects: 'Subjects',
		unionHegemonies: 'Hegemony Federations',
		unionFederations: 'Other Federations',
		unionFederationsColor: 'Federation Member Color',
		unionLeaderSymbol: 'Union Leader Symbol',
		unionLeaderSymbolSize: 'Union Leader Symbol Size',
		unionLeaderUnderline: 'Underline Union Leader Name',
		countryNames: 'Names',
		countryNamesType: 'Name Type',
		countryNamesMinSize: 'Name Min Size',
		countryNamesMinSize_tooltip: 'If this size does not fit, the name is not drawn.',
		countryNamesMaxSize: 'Name Max Size',
		countryNamesMaxSize_tooltip:
			'The name will not be drawn bigger than this, even if there is room.',
		countryNamesSecondaryRelativeSize: 'Secondary Name Relative Size',
		countryNamesFont: 'Font',
		countryEmblems: 'Emblems',
		countryEmblemsMinSize: 'Emblem Min Size',
		countryEmblemsMinSize_tooltip: 'If this size does not fit, the emblem is not drawn.',
		countryEmblemsMaxSize: 'Emblem Max Size',
		countryEmblemsMaxSize_tooltip:
			'The emblem will not be drawn bigger than this, even if there is room.',
		labelsAvoidHoles: 'Avoid Holes in Border',
		systemNames: 'System Names',
		systemNamesFont: 'Font',
		systemNamesFontSize: 'Font Size',
		countryCapitalIcon: 'Country Capital',
		sectorCapitalIcon: 'Sector Capital',
		populatedSystemIcon: 'Populated System',
		unpopulatedSystemIcon: 'Other System',
		wormholeIcon: 'Wormhole',
		gatewayIcon: 'Gateway',
		lGateIcon: 'L-Gate',
		shroudTunnelIcon: 'Shroud Tunnel',
		hyperlaneStroke: 'Hyperlanes',
		hyperlaneColor: 'Hyperlane Color',
		unownedHyperlaneColor: 'Unowned Hyperlane Color',
		hyperRelayStroke: 'Hyper Relays',
		hyperRelayColor: 'Hyper Relay Color',
		unownedHyperRelayColor: 'Unowned Hyper Relay Color',
		hyperlaneMetroStyle: 'Metro-style Hyperlanes',
		hyperlaneMetroStyle_tooltip: `<ul>
			<li>Draw hyperlanes in the style of metro/subway maps.</li>
			<li>Automatically enables "Align Solar Systems to Grid".</li>
		</ul>`,
		wormholeStroke: 'Wormhole Links',
		wormholeStrokeColor: 'Wormhole Links Color',
		lGateStroke: 'L-Gate Links',
		lGateStrokeColor: 'L-Gate Links Color',
		shroudTunnelStroke: 'Shroud Tunnel Links',
		shroudTunnelStrokeColor: 'Shroud Tunnel Links Color',
		terraIncognita: 'Terra Incognita',
		terraIncognitaPerspectiveCountry: 'Perspective Country',
		terraIncognitaStyle: 'Style',
		terraIncognitaBrightness: 'Brightness',
		backgroundColor: 'Background Color',
		alignStarsToGrid: 'Align Solar Systems to Grid',
		circularGalaxyBorders: 'Circular Galaxy Borders',
		circularGalaxyBorders_tooltip: `<ul>
			<li>When enabled, the overall border of the galaxy will be circular in shape, and there will be no "holes" between systems.</li>
			<li>If the galaxy is a "Starburst", a special spiral shape will be used instead of a circle.</li>
		</ul>`,
		hyperlaneSensitiveBorders: 'Hyperlane Sensitive Borders',
		hyperlaneSensitiveBorders_tooltip: `<ul>
			<li>When enabled, borders will follow hyperlanes.</li>
			<li>When disabled, only solar systems affect borders.</li>
			<li>Not supported if the following are enabled:
				<ul>
					<li>Metro-style Hyperlanes</li>
					<li>Align Solar Systems to Grid</li>
				</ul>
			</li>
		</ul>`,
		voronoiGridSize: 'Voronoi Grid Size',
		voronoiGridSize_tooltip: `<ul>
			<li>Higher values make borders "looser".</li>
			<li>Lower values make borders "tighter".</li>
			<li>Lower values take longer to process.</li>
			<li><strong>WARNING</strong>: values below 10 can take a very long time to process.</li>
		</ul>`,
		claimVoidMaxSize: 'Claim Bordering Void Max Size',
		claimVoidMaxSize_tooltip: `<ul>
			<li>Empty "void" between systems can be claimed by neighboring country borders.</li>
			<li>Only void smaller than this size can be claimed.</li>
			<li>Set to 0 or leave empty to disable this behavior entirely.</li>
		</ul>`,
		claimVoidBorderThreshold: 'Claim Bordering Void Threshold',
		claimVoidBorderThreshold_tooltip: `<ul>
			<li>Empty pockets of "void" between systems can be claimed by neighboring country borders.</li>
			<li>To claim void, a country much control at least this much of the void's border.</li>
			<li>Set to full so only fully enclosed void is claimed.</li>
			<li>Set to empty so all void bordering at least one country is claimed.</li>
		</ul>`,
		starScapeDust: 'Dust',
		starScapeDustColor: 'Dust Color',
		starScapeNebula: 'Nebulas',
		starScapeNebulaColor: 'Nebula Color',
		starScapeNebulaAccentColor: 'Nebula Accent Color',
		starScapeCore: 'Core',
		starScapeCoreColor: 'Core Color',
		starScapeCoreAccentColor: 'Core Accent Color',
		starScapeStars: 'Stars',
		starScapeStarsColor: 'Stars Color',
		starScapeStarsCount: 'Star Count',
		appLocale: 'StellarMaps Language',
		appLocale_tooltip: 'Join the Discord server (link the top bar) if you want to help translate!',
		appStellarisLanguage: 'Stellaris Language',
		appTranslatorMode: 'Translator Mode',
		appTranslatorMode_tooltip: `
		<strong>For StellarMaps translators:</strong>
		<ul>
			<li>Hold Alt to view message IDs.</li>
			<li>Select a translation file to use for messages.</li>
			<li>Reloads messages when the file is edited.</li>
			<li>Shows warnings about missing and extra messages.</li>
			<li>You need to reselect the file if you reload the application.</li>
		</ul>`,
	},
};
