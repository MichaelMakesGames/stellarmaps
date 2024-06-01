export default {
	// messages in the top bar of the app
	top_bar: {
		stellar_maps: '群星地圖',
		download_latest_release: '下載最新版本',
	},
	// messages in the side bar (save selection and map settings)
	// note: messages for specific settings are in the 'setting' and 'option' sections
	side_bar: {
		save_game: '遊戲存檔', // header above controls to select save
		refresh_saves_button: '重新整理',
		select_manually_button: '手動選擇',
		select_save_placeholder: '選擇存檔...',
		load_save_button: '讀取存檔',
		map_settings: '地圖設定',
		save_settings_button: '儲存',
		load_settings_button: '讀取',
		custom_setting_profiles: '自訂',
		preset_setting_profiles: '預設',
		apply_changes_button: '應用變更',
	},
	// messages in the main map section
	map: {
		select_save: '左上角選擇存檔',
		loading: '讀取中...',
		error: '發生了錯誤',
	},
	// various generic messages
	generic: {
		enabled: '啓用',
		disabled: '停用',
		cancel_button: '取消',
		close_button: '關閉',
		loading: '讀取中...',
		confirmation: '你確定嗎?',
	},
	// various confirmation popups
	confirmation: {
		unsaved_setting_profile: '您尚未儲存自訂地圖的設定，這些變更將會遺失。',
		delete_setting_profile: '您即將刪除 "{name}". 這是無法挽回的。',
	},
	// various prompt popups
	prompt: {
		enter_settings_profile_name: '輸入名稱',
		select_save_file: '選擇存檔',
		select_save_file_filter_name: '群星存檔',
		select_stellaris_install: '選擇安裝位置',
	},
	// input validation messages
	validation: {
		required: '必填',
		min: '最小: {min, number}',
		max: '最大: {max, number}',
		min_max: '最小: {min, number}, 最大: {max, number}',
	},
	// various notification popups
	notification: {
		settings_profile_saved: '"{name}" 設定儲存',
		failed_to_load_save_list: '未能讀取群星存檔',
		failed_to_load_save_file: '未能讀取 {filePath}',
		export_success: '成功導出',
		export_failed: '未能導出',
		failed_to_load_stellaris_data: {
			title: '未能讀取群星資訊',
			description:
				'請嘗試手動選擇安裝位置。該位置應有 "common"， "flags"，和 "localisation" 資料夾 (among others).',
			action: '選擇安裝',
		},
	},
	// messages for the export button and popup
	export: {
		button: '導出',
		header: '導出圖片',
		image_size: '圖片大小',
		lock_aspect_ratio: '鎖定高寬比例',
		zoom: '縮放',
		center: '置中',
		center_hint: '(這個銀河系的直徑約爲1000個單位)',
		preview: '預覽:',
		click_to_center: '(點擊置中)',
		reset_button: '重置',
		export_svg_button: '導出 SVG',
		export_png_button: '導出 PNG',
		processing: '處理中...',
	},
	// messages in the app settings popup
	app_settings: {
		title: '設定',
		description: '所有更改都會自動保存和應用。',
		select_translator_mode_file: '選擇翻譯文本',
		translator_mode_no_file: '未選擇檔案',
		translator_mode_file: '讀取 {filePath}',
		translator_mode_untranslated_messages: '未翻譯訊息: {number, number}',
		translator_mode_extra_messages: '無效訊息編號: {number, number}',
	},
	// labels for various types of setting controls
	// (shared by multiple settings)
	control: {
		color: {
			label: '顔色',
			adjustment: {
				header: '顏色調整',
				add_button: '+ 新增調整',
				placeholder: '選擇調整類型...',
			},
		},
		icon: {
			label: '圖示',
			size: '大小',
			advanced_options: {
				header: '進階選項',
				position: '位置',
				priority: '優先度',
			},
		},
		stroke: {
			width: '寬度',
			more_styles: {
				header: '更多風格',
				smoothed: '平滑',
				glow: '熒光',
				dashed: '破折號',
				dash_pattern: '圖樣',
				dash_pattern_tooltip:
					'空格分隔的表格，決定破折號和間隙的長度。 例如，「3 1」是 3 長度的破折號，後面跟著 1 長度的間隙。 對於複雜的模式，您可以使用更長的清單。',
			},
		},
	},
	// dropdown options for various settings
	option: {
		color: {
			group: {
				dynamic: '動態色彩',
				stellaris: '群星色彩',
				stellar_maps: '群星地圖色彩',
			},
			primary: '主要',
			secondary: '次要',
			border: '邊框',
		},
		color_adjustment: {
			LIGHTEN: '淡化',
			DARKEN: '暗化',
			MIN_LIGHTNESS: '最小亮度',
			MAX_LIGHTNESS: '最大亮度',
			MIN_CONTRAST: '最小對比度',
			OPACITY: '不透明度',
		},
		icon: {
			group: {
				basic_shape: '基本形狀',
				stars: '星星',
				other_shapes: '其他形狀',
				stellaris: '群星',
			},
			triangle: '三角形',
			triangle_flat: '三角形 (平頂)',
			diamond: '鑽石形',
			square: '方形',
			pentagon: '五邊形',
			pentagon_flat: '五邊形 (平頂)',
			hexagon: '六邊形',
			hexagon_flat: '六邊形 (平頂)',
			heptagon: '七邊形',
			heptagon_flat: '七邊形 (平頂)',
			octagon: '八邊形',
			octagon_flat: '八邊形 (平頂)',
			circle: '圓形',
			star_3_pointed: '三尖星',
			star_4_pointed: '四尖星',
			star_5_pointed: '五尖星',
			star_6_pointed: '六尖星',
			star_7_pointed: '七尖星',
			star_8_pointed: '八尖星',
			cross: '叉',
			wormhole: '蟲洞',
			gateway: '星門',
			l_gate: 'L-星門',
			shroud_tunnel: '虛境通道 (非官方)',
		},
		icon_position: {
			center: '置中',
			left: '置左對齊',
			right: '置右對齊',
			top: '置上對齊',
			bottom: '置下對齊',
		},
		glyph: {
			none: '無',
			star_4_pointed: '✦ 四尖星',
			star_4_pointed_outline: '✧ 四尖星 (外框)',
			star_5_pointed: '★ 五尖星',
			star_5_pointed_outline: '☆ 五尖星 (外框)',
			star_5_pointed_circled: '✪ 五尖星 (圓框)',
			star_5_pointed_pinwheel: '✯ 五尖星 (風車)',
			star_6_pointed: '✶ 六尖星',
			star_8_pointed: '✴ 八尖星',
		},
		union: {
			joined_borders: '相同顏色，連接邊框',
			separate_borders: '相同顏色，各自邊框',
			off: '關閉',
		},
		union_federations_color: {
			founder: '創建者',
			leader: '現領導國家',
		},
		country_names_type: {
			country_only: '僅國家名稱',
			player_only: '僅玩家名稱',
			country_then_player: '國家名稱然後玩家名稱',
			player_then_country: '玩家名稱然後國家名稱',
		},
		labels_avoid_holes: {
			all: '全部',
			owned: '擁有的',
			none: '無',
		},
		terra_incognita_perspective_country: {
			player: '玩家',
		},
		terra_incognita_style: {
			flat: '平滑',
			striped: '條紋',
			cloudy: '迷霧',
		},
		system_names: {
			none: '無',
			country_capitals: '國家首都星系',
			sector_capitals: '國家和星域首都星系',
			colonized: '殖民星系',
			all: '全部星系',
		},
	},
	// labels and tooltips for various settings
	setting: {
		group: {
			borders: '國家邊框',
			unions: '聯邦邊框',
			countryLabels: '國家圖示',
			systemLabels: '星系圖示',
			systemIcons: '銀河圖示',
			hyperlanes: '超空間航道',
			bypassLinks: '空間隧道',
			terraIncognita: '未知空間',
			misc: '其他',
			advancedBorder: '進階邊框設定',
			starscape: '星海背景（實驗）',
		},
		borderStroke: '國家邊框',
		borderColor: '國家邊框顔色',
		borderFillColor: '國家填充色',
		borderFillFade: '國家填充色 褪色度',
		borderFillFade_tooltip: `<ul>
			<li>在邊界添加淡出效果。</li>
			<li>邊界是從100%不透明開始。</li>
			<li>如果國家填充色的透明度越低，效果越好。</li>
		</ul>`,
		sectorBorderStroke: '星域邊框',
		sectorBorderColor: '星域邊框顔色',
		unionBorderStroke: '聯邦邊框',
		unionBorderColor: '聯邦邊框顔色',
		unionMode: '聯邦模式',
		unionSubjects: '附庸',
		unionHegemonies: '霸權聯邦',
		unionFederations: '其他聯邦',
		unionFederationsColor: '聯邦成員顔色',
		unionLeaderSymbol: '聯邦領袖圖示',
		unionLeaderSymbolSize: '聯邦領袖圖示大小',
		unionLeaderUnderline: '聯邦領袖國名 底綫',
		countryNames: '國名',
		countryNamesType: '國名類型',
		countryNamesMinSize: '名稱最小尺寸',
		countryNamesMinSize_tooltip: '如果這個尺寸不合適，則不會繪製國名。',
		countryNamesMaxSize: '名稱最大尺寸',
		countryNamesMaxSize_tooltip: '即使有足夠空間，國名也不會畫得比這個大。',
		countryNamesSecondaryRelativeSize: '次要名稱 相對大小',
		countryNamesFont: '字體',
		countryEmblems: '國家徽章',
		countryEmblemsMinSize: '徽章最小尺寸',
		countryEmblemsMinSize_tooltip: '如果這個尺寸不合適，則不會繪製徽章。',
		countryEmblemsMaxSize: '徽章最大尺寸',
		countryEmblemsMaxSize_tooltip: '即使有足夠空間，徽章也不會畫得比這個大。',
		labelsAvoidHoles: '避免邊框出現漏洞',
		systemNames: '星系名稱',
		systemNamesFont: '字體',
		systemNamesFontSize: '字體大小',
		countryCapitalIcon: '國家首都',
		sectorCapitalIcon: '星域首都',
		populatedSystemIcon: '殖民星系',
		unpopulatedSystemIcon: '其他星系',
		wormholeIcon: '蟲洞',
		gatewayIcon: '星門',
		lGateIcon: 'L-星門',
		shroudTunnelIcon: '虛境隧道',
		hyperlaneStroke: '超空間航道',
		hyperlaneColor: '超空間航道顔色',
		unownedHyperlaneColor: '未知超空間航道顔色',
		hyperRelayStroke: '超空間中繼器',
		hyperRelayColor: '超空間中繼器顔色',
		unownedHyperRelayColor: '未知超空間中繼器顔色',
		hyperlaneMetroStyle: '地鐵風格的超空間航道',
		hyperlaneMetroStyle_tooltip: `<ul>
			<li>以地鐵/鐵路地圖的風格繪製超空間航道。</li>
			<li>自動啟用 "以網格排列星系".</li>
		</ul>`,
		wormholeStroke: '蟲洞鏈接',
		wormholeStrokeColor: '蟲洞鏈接顔色',
		lGateStroke: 'L-星門鏈接',
		lGateStrokeColor: 'L-星門鏈接顔色',
		shroudTunnelStroke: '虛境隧道鏈接',
		shroudTunnelStrokeColor: '虛境隧道鏈接顔色',
		terraIncognita: '未知空間',
		terraIncognitaPerspectiveCountry: '國家視角',
		terraIncognitaStyle: '風格',
		terraIncognitaBrightness: '光亮',
		backgroundColor: '背景顔色',
		alignStarsToGrid: '以網格排列星系',
		circularGalaxyBorders: '圓形銀河邊框',
		circularGalaxyBorders_tooltip: `<ul>
			<li>啟用後，銀河系的整體邊界會是圓形的，並且星系之間不會有漏洞。</li>
			<li>如果星系是「星爆」星系，則會使用特殊的螺旋形狀而不是圓形。</li>
		</ul>`,
		hyperlaneSensitiveBorders: '超空間邊框敏感',
		hyperlaneSensitiveBorders_tooltip: `<ul>
			<li>啟用後，邊框將緊貼超空間航道。</li>
			<li>禁用時，只有星系會影響邊界。</li>
			<li>如果啟用以下功能則不支援:
				<ul>
					<li>地鐵風格的超空間航道</li>
					<li>以網格排列星系</li>
				</ul>
			</li>
		</ul>`,
		voronoiGridSize: '沃羅諾伊網格尺寸',
		voronoiGridSize_tooltip: `<ul>
			<li>數值越高，邊界越「寬鬆」。</li>
			<li>較低的值使邊界“更緊”。</li>
			<li>較低的值需要較長的處理時間。</li>
			<li><strong>警告</strong>: 低於 10 的數值可能需要更多時間才能處理。</li>
		</ul>`,
		claimVoidMaxSize: '占領空白邊界的最大尺寸',
		claimVoidMaxSize_tooltip: `<ul>
			<li>可以占領國家邊境之間的空白漏洞。</li>
			<li>只能占領小於此尺寸的空隙。</li>
			<li>設定為 0 或留空可以完全停用此行為。</li>
		</ul>`,
		claimVoidBorderThreshold: '占領邊界無效閾值',
		claimVoidBorderThreshold_tooltip: `<ul>
			<li>可以占領國家邊境之間的空白漏洞。</li>
			<li>要占領空白邊界，一個國家至少要控制這部分空白漏洞。</li>
			<li>設定調越高，需要占領更多的邊境才能占領空白漏洞。</li>
			<li>設定留空，所有空白會被至少一個國家所占領。</li>
		</ul>`,
		starScapeDust: '星塵',
		starScapeDustColor: '星塵顔色',
		starScapeNebula: '星雲',
		starScapeNebulaColor: '星雲顔色',
		starScapeNebulaAccentColor: '星雲主要顔色',
		starScapeCore: '星核',
		starScapeCoreColor: '星核顔色',
		starScapeCoreAccentColor: '星核主要顔色',
		starScapeStars: '群星',
		starScapeStarsColor: '群星顔色',
		starScapeStarsCount: '群星數量',
		appLocale: '群星地圖語言',
		appLocale_tooltip: '如果你想幫助我們翻譯，加入Discord (鏈接在面板上面) ！',
		appStellarisLanguage: '群星語言',
		appStellarisLanguage_tooltip: '存檔中的文字所使用的語言 (例如國家，星系和星球名稱)。',
		appTranslatorMode: '翻譯者模式',
		appTranslatorMode_tooltip: `
		<strong> 至群星地圖翻譯者:</strong>
		<ul>
			<li>按 Alt 可以看到字句編號</li>
			<li>選擇字句文件用作翻譯。</li>
			<li>編輯文件時會快速載入字句。</li>
			<li>顯示有關遺失和相關訊息的警告。</li>
			<li>如果重新載入應用程序，您需要選擇該檔案。</li>
		</ul>`,
	},
};
