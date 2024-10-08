export default {
	// messages in the top bar of the app
	top_bar: {
		stellar_maps: 'StellarMaps',
		download_latest_release: '最新版をダウンロード',
	},
	// messages in the side bar (save selection and map settings)
	// note: messages for specific settings are in the 'setting' and 'option' sections
	side_bar: {
		save_game: 'セーブデータ', // header above controls to select save
		refresh_saves_button: '更新',
		select_manually_button: '手動選択',
		select_save_placeholder: 'セーブデータの選択...',
		load_save_button: 'セーブデータのロード',
		map_settings: 'マップ設定',
		save_settings_button: '保存',
		load_settings_button: '読込',
		custom_setting_profiles: 'カスタム設定',
		preset_setting_profiles: 'プリセット設定',
		apply_changes_button: '変更を適用',
	},
	// messages in the main map section
	map: {
		select_save: 'ウィンドウ左上部の『セーブデータ』からセーブデータを選択してください',
		loading: 'しばらくお待ちください...',
		error: '何らかの問題が発生しました',
		click_to_view_system: 'クリックすると星系マップを開きます',
		tooltip: {
			colonies: '植民地',
		},
	},
	// various generic messages
	generic: {
		NEVER: 'THIS IS A BUG', // this message will never be displayed
		enabled: '有効',
		disabled: '無効',
		back_button: '戻る',
		cancel_button: 'キャンセル',
		close_button: '閉じる',
		loading: 'ロード中...',
		confirmation: 'よろしいですか？',
	},
	// various confirmation popups
	confirmation: {
		unsaved_setting_profile: '変更したマップ設定が保存されていません。これらの変更は失われます。',
		delete_setting_profile: '"{name}"を削除しようとしています。実行すると取り消しできません。',
	},
	prompt: {
		// various prompt popups
		enter_settings_profile_name: '設定名の入力',
		select_save_file: 'セーブデータの選択',
		select_save_file_filter_name: 'Stellarisセーブデータ',
		select_stellaris_install: 'Stellarisのインストールフォルダを選択',
	},
	validation: {
		// input validation messages
		required: '必要',
		min: '最小: {min, number}',
		max: '最大: {max, number}',
		min_max: '最小: {min, number}, 最大: {max, number}',
	},
	notification: {
		// various notification popups
		settings_profile_saved: '"設定{name}"をセーブしました',
		failed_to_load_save_list: 'Stellarisのセーブデータの読み込みに失敗しました',
		failed_to_load_save_file: '{filePath}の読み込みに失敗しました',
		export_success: 'エクスポート完了',
		export_failed: 'エクスポート失敗',
		failed_to_load_stellaris_data: {
			title: 'Stellarisのデータの読み込みに失敗しました',
			description:
				'インストール場所を手動で選択してみてください。これは、"common"、"flags"、"localisation "フォルダを含むフォルダでなければなりません。',
			action: 'インストール場所を選択',
		},
	},
	export: {
		// messages for the export button and popup
		button: 'エクスポート',
		header: '画像を出力する',
		image_size: '画像サイズ',
		lock_aspect_ratio: 'アスペクト比を固定',
		zoom: '拡大率',
		center: '中心位置',
		center_hint: '(銀河の直径は約1000ユニットになります)',
		preview: 'プレビュー:',
		click_to_center: '(クリックで中心が移動)',
		reset_button: 'リセット',
		export_svg_button: 'SVGファイルで出力',
		export_png_button: 'PNGファイルで出力',
		processing: '出力中...',
	},
	app_settings: {
		// messages in the app settings popup
		title: '設定',
		description: 'すべての変更は自動的に保存され、適用されます。',
		select_translator_mode_file: '翻訳ファイルの選択',
		translator_mode_no_file: '選択されていません',
		translator_mode_file: '選択中： {filePath}',
		translator_mode_untranslated_messages: '未翻訳メッセージ: {number, number}',
		translator_mode_extra_messages: '無効なメッセージID: {number, number}',
	},
	control: {
		// labels for various types of setting controls
		// (shared by multiple settings)
		color: {
			label: '色',
			adjustment: {
				header: '色調整',
				add_button: '+ 調整項目を追加',
				placeholder: '項目を選択...',
			},
		},
		icon: {
			label: 'アイコン',
			size: 'サイズ',
			advanced_options: {
				header: '詳細オプション',
				position: '位置',
				priority: '優先順位',
			},
		},
		stroke: {
			width: '幅',
			more_styles: {
				header: '追加の表示スタイル',
				smoothed: 'スムース',
				glow: 'グロウ',
				dashed: '破線',
				dash_pattern: 'パターン',
				dash_pattern_tooltip:
					'スペースで区切られたリストで、ダッシュとギャップの長さを指定する。例えば、"3 1 "は、3つの長さのダッシュと1つの長さのギャップを表します。複雑なパターンには、もっと長いリストを使うことができます。',
			},
		},
	},
	option: {
		// dropdown options for various settings
		color: {
			group: {
				dynamic: 'ダイナミック・カラー',
				stellaris: 'Stellarisの色',
				stellar_maps: 'StellarMapsの色',
			},
			primary: 'メインカラー',
			secondary: 'サブカラー',
			border: 'ボーダー',
		},
		color_adjustment: {
			LIGHTEN: '明るくする',
			DARKEN: '暗くする',
			MIN_LIGHTNESS: '最小明度',
			MAX_LIGHTNESS: '最大明度',
			MIN_CONTRAST: '最小コントラスト',
			OPACITY: '不透明度',
		},
		icon: {
			group: {
				basic_shape: '基本シェイプ',
				stars: 'スター',
				other_shapes: '他のシェイプ',
				stellaris: 'Stellarisゲーム内',
			},
			triangle: '三角形',
			triangle_flat: '三角形(倒立)',
			diamond: 'ダイヤモンド',
			square: '四角形',
			pentagon: '五角形',
			pentagon_flat: '五角形(倒立)',
			hexagon: '六角形',
			hexagon_flat: '六角形(横倒し)',
			heptagon: '七角形',
			heptagon_flat: '七角形(倒立)',
			octagon: '八角形',
			octagon_flat: '八角形(横倒し)',
			circle: '円形',
			star_3_pointed: '3頂点スター',
			star_4_pointed: '4頂点スター',
			star_5_pointed: '5頂点スター',
			star_6_pointed: '6頂点スター',
			star_7_pointed: '7頂点スター',
			star_8_pointed: '8頂点スター',
			cross: '十字',
			wormhole: 'ワームホール',
			gateway: 'ゲートウェイ',
			l_gate: 'Lゲート',
			shroud_tunnel: 'シュラウド・トンネル(非公式)',
		},
		icon_position: {
			center: '中心',
			left: '左',
			right: '右',
			top: '上',
			bottom: '下',
		},
		glyph: {
			none: 'なし',
			star_4_pointed: '✦ 4頂点スター',
			star_4_pointed_outline: '✧ 4頂点スター(中抜き)',
			star_5_pointed: '★ 5頂点スター',
			star_5_pointed_outline: '☆ 5頂点スター(中抜き)',
			star_5_pointed_circled: '✪ 5頂点スター (丸地)',
			star_5_pointed_pinwheel: '✯ 5頂点スター (風車)',
			star_6_pointed: '✶ 6頂点スター',
			star_8_pointed: '✴ 8頂点スター',
		},
		union: {
			joined_borders: '同じ色、結合された境界線',
			separate_borders: '同じ色、別々の境界線',
			off: 'オフ',
		},
		union_federations_color: {
			founder: '創設国',
			leader: '現在の指導国',
		},
		country_names_type: {
			country_only: '国名のみ',
			player_only: 'プレイヤー名のみ',
			country_then_player: '国名→プレイヤー名',
			player_then_country: 'プレイヤー名→国名',
		},
		labels_avoid_holes: {
			all: 'すべて避ける',
			owned: '他国の領土は避ける',
			none: '無視する',
		},
		country: {
			player: 'プレイヤー',
		},
		terra_incognita_style: {
			flat: 'フラット',
			striped: 'ストライプ',
			cloudy: 'もや状',
		},
		system_names: {
			none: 'なし',
			country_capitals: '帝国首都',
			sector_capitals: '帝国首都及びセクター首都',
			colonized: '入植済みの星系',
			all: 'すべての星系',
		},
		system_map_label_position: {
			top: '上',
			bottom: '下',
			right: '右',
			left: '左',
			orbit: '軌道に沿わせる',
		},
	},
	setting: {
		// labels and tooltips for various settings
		group: {
			borders: '境界線',
			unions: '同盟モード',
			occupation: '戦争',
			countryLabels: '国ラベル',
			systemLabels: '星系ラベル',
			systemIcons: '星系アイコン',
			hyperlanes: 'ハイパーレーン',
			bypassLinks: 'バイパス',
			terraIncognita: 'テラ・インコグニタ',
			misc: 'その他',
			advancedBorder: '境界線の詳細設定',
			starscape: '星景',
			legend: '凡例',
			solarSystemMap: '星系マップ',
		},
		mapMode: 'マップモード',
		mapModePointOfView: '視点',
		mapModePointOfView_tooltip: `<ul>
			<li><strong>警告</strong>: プレイヤー以外の視点を見ることで通常得ることのできない情報を得られる可能性があります。『ピュア』な体験を求める場合、視点の変更はしないでください。</li>
			<li>Tip: マップ上の帝国を<strong>Shiftキーを押しながら左クリック</strong>すると、視点をダイレクトに変更できます。</li>
		</ul>`,
		mapModeSpecies: '種族',
		borderStroke: '国境線',
		borderColor: '国境線の色',
		borderFillColor: '帝国の塗りつぶし色',
		borderFillFade: '塗りつぶしのフェード',
		borderFillFade_tooltip: `<ul>
			<li>ボーダー付近でフェードアウト効果を加えます。</li>
			<li>不透明度は100％から開始します。</li>
			<li>帝国の塗りつぶし色の不透明度が低い場合に最適です。</li>
		</ul>`,
		frontierBubbleThreshold: 'フロンティア・バブルの閾値',
		frontierBubbleThreshold_tooltip: `<ul>
			<li>フロンティアバブルは、隣接するセクターの一部であるかのように描かれます。</li>
			<li>フロンティア・バブルとは、ハイパーレーンで結ばれたセクターの無い星系の集団のことです。</li>
			<li>この設定はフロンティアバブル内の星系の最大数を決定します。</li>
			<li>この欄が空白または0が入力されていると、この機能は無効化されます。</li>
		</ul>`,
		sectorTypeBorderStyles: 'セクターの種類でスタイルを変える',
		sectorTypeBorderStyles_tooltip:
			'コア・セクターとフロンティア・セクターの境界線に別々のスタイル設定を追加します。',
		sectorBorderStroke: 'セクター境界',
		sectorBorderColor: 'セクター境界色',
		sectorCoreBorderStroke: 'コア・セクター境界',
		sectorCoreBorderColor: 'コア・セクター境界色',
		sectorFrontierBorderStroke: 'フロンティア・セクター境界',
		sectorFrontierBorderColor: 'フロンティア・セクター境界色',
		unionBorderStroke: '連邦の境界',
		unionBorderColor: '連邦境界色',
		unionMode: '同盟モード',
		unionSubjects: '従属国',
		unionHegemonies: '覇権国連邦',
		unionFederations: 'その他の連邦',
		unionFederationsColor: '連邦領域の色',
		unionLeaderSymbol: '宗主国/連邦指導国のシンボル',
		unionLeaderSymbolSize: '宗主国/連邦指導国のシンボルのサイズ',
		unionLeaderUnderline: '宗主国/連邦指導国の名前に下線を付ける',
		occupation: '占領',
		occupationColor: '占領表示色',
		countryNames: '国名表示',
		countryNamesType: '国名のタイプ',
		countryNamesMinSize: '名前の文字最小サイズ',
		countryNamesMinSize_tooltip: 'このサイズ以下になってしまう場合、名前は描かれません。',
		countryNamesMaxSize: '名前の文字最大サイズ',
		countryNamesMaxSize_tooltip:
			'たとえ十分なスペースがあっても名前がこれより大きく描かれることはありません。',
		countryNamesSecondaryRelativeSize: 'セカンダリーネームの相対サイズ',
		countryNamesFont: 'フォント',
		countryEmblems: '国旗',
		countryEmblemsMinSize: '国旗の最小サイズ',
		countryEmblemsMinSize_tooltip: 'このサイズ以下になってしまう場合、国旗は描かれません。',
		countryEmblemsMaxSize: '国旗の最大サイズ',
		countryEmblemsMaxSize_tooltip:
			'たとえ十分なスペースがあっても国旗がこれより大きく描かれることはありません。',
		labelsAvoidHoles: '国境内の飛び地/空白地について',
		systemNames: '星系名',
		systemNamesFont: 'フォント',
		systemNamesFontSize: 'フォントサイズ',
		countryCapitalIcon: '帝国首都',
		sectorCapitalIcon: 'セクター首都',
		populatedSystemIcon: '入植済み星系',
		unpopulatedSystemIcon: 'その他の星系',
		wormholeIcon: 'ワームホール',
		gatewayIcon: 'ゲートウェイ',
		lGateIcon: 'Lゲート',
		shroudTunnelIcon: 'シュラウド・トンネル',
		hyperlaneStroke: 'ハイパーレーン',
		hyperlaneColor: 'ハイパーレーンの色',
		unownedHyperlaneColor: '不明なハイパーレーンの色',
		hyperRelayStroke: 'ハイパーリレイ',
		hyperRelayColor: 'ハイパーリレイの色',
		unownedHyperRelayColor: '不明なハイパーリレイの色',
		hyperlaneMetroStyle: '鉄道路線図風にハイパーレーンを表示する',
		hyperlaneMetroStyle_tooltip: `<ul>
			<li>ハイパーレーンを鉄道路線図風のスタイルで表示します。</li>
			<li>『星系をグリッドに合わせる』が自動で有効になります。</li>
		</ul>`,
		wormholeStroke: 'ワームホール接続',
		wormholeStrokeColor: 'ワームホール接続の色',
		lGateStroke: 'Lゲート接続',
		lGateStrokeColor: 'Lゲート接続の色',
		shroudTunnelStroke: 'シュラウド・トンネル接続',
		shroudTunnelStrokeColor: 'シュラウド・トンネル接続の色',
		terraIncognita: '未探査エリアを隠す',
		terraIncognitaPerspectiveCountry: '未探査エリアの基準国',
		terraIncognitaStyle: '表示スタイル',
		terraIncognitaBrightness: '明るさ',
		backgroundColor: '背景色',
		alignStarsToGrid: '星系をグリッドに合わせる',
		circularGalaxyBorders: '銀河の境界を円形にする',
		circularGalaxyBorders_tooltip: `<ul>
			<li>有効にすると、銀河全体の境界は円形になり、星系間の「穴」はなくなります。</li>
			<li>銀河の形状が『スターバースト』である場合、円の代わりに特殊な渦巻き形状が使用されます。</li>
		</ul>`,
		borderGap: 'ボーダー・ギャップ',
		borderGap_tooltip: '国境間に隙間を追加する',
		hyperlaneSensitiveBorders: '境界線をハイパーレーンに反応させる',
		hyperlaneSensitiveBorders_tooltip: `<ul>
			<li>有効にすると、境界線はハイパーレーンに従います。</li>
			<li>無効にすると、国境に影響するのは星系のみとなります。</li>
			<li>以下が有効になっている場合はサポートされません。:
				<ul>
					<li>『鉄道路線図風にハイパーレーンを表示する』</li>
					<li>『星系をグリッドに合わせる』</li>
				</ul>
			</li>
		</ul>`,
		voronoiGridSize: 'ボロノイ・グリッドサイズ',
		voronoiGridSize_tooltip: `<ul>
			<li>値が大きいほど、ボーダーは「緩く」なります。</li>
			<li>値が低いほど、国境は「タイト」になります。</li>
			<li>値が小さいほど処理に時間がかかります。</li>
			<li><strong>警告</strong>: 10を下回る値にすると処理に非常に時間がかかります。</li>
		</ul>`,
		claimVoidMaxSize: '星系間空間の取り込み最大値',
		claimVoidMaxSize_tooltip: `<ul>
			<li>星系の間にできる『ボイド』を隣接する帝国の国境を拡大して埋めるようにします。</li>
			<li>このサイズより小さいボイドだけが対象になります。</li>
			<li>この動作を完全に無効にするには0を設定するか、空のままにしてください。</li>
		</ul>`,
		claimVoidBorderThreshold: '星系間空間の取り込み閾値',
		claimVoidBorderThreshold_tooltip: `<ul>
			<li>星系間の『ボイド』を埋めるには、隣接する国の国境の長さが必要です。</li>
			<li>空白を主張するには、その国が少なくとも指定された割合のボイドの境界を支配する必要があります。</li>
			<li>最大に設定すると、完全に囲まれたボイドのみが請求されます。</li>
			<li>最小に設定すると、少なくとも1つの国と国境を接するすべてのボイドが請求されます。</li>
		</ul>`,
		starScapeDust: '銀河の塵',
		starScapeDustColor: '塵の色',
		starScapeNebula: '星雲',
		starScapeNebulaColor: '星雲の色',
		starScapeNebulaAccentColor: '星雲のアクセント色',
		starScapeCore: '銀河コア',
		starScapeCoreColor: '銀河コアの色',
		starScapeCoreAccentColor: '銀河コアのアクセント色',
		starScapeStars: '背景の星',
		starScapeStarsColor: '背景の星の色',
		starScapeStarsCount: '背景の星の数',
		legend: '凡例',
		legendFontSize: 'フォントサイズ',
		legendBorderStroke: '境界',
		legendBorderColor: '境界の色',
		legendBackgroundColor: '背景色',
		systemMapOrbitStroke: '惑星軌道',
		systemMapOrbitColor: '惑星軌道表示色',
		systemMapPlanetScale: '惑星の大きさ',
		systemMapLabelPlanetsFont: '惑星名のフォント',
		systemMapLabelPlanetsFontSize: '惑星名のフォントサイズ',
		systemMapLabelPlanetsPosition: '惑星名の位置',
		systemMapLabelPlanetsFallbackPosition: '惑星名の位置(フォールバック)',
		systemMapLabelColoniesEnabled: '植民地名の表示',
		systemMapLabelStarsEnabled: '恒星名の表示',
		systemMapLabelPlanetsEnabled: '惑星名の表示',
		systemMapLabelMoonsEnabled: '衛星名の表示',
		systemMapLabelAsteroidsEnabled: '小惑星名の表示',
		systemMapHyperlanesEnabled: 'ハイパーレーン接続の表示',
		appLocale: 'StellarMapsの言語',
		appLocale_tooltip:
			'翻訳を手伝いたい人はDiscordサーバー（トップバーのリンク）に参加してください！',
		appStellarisLanguage: 'Stellarisの言語',
		appStellarisLanguage_tooltip:
			'Stellarisファイルのテキストに使用される言語（国名、星系名、惑星名など）。',
		appTranslatorMode: '翻訳者モード',
		appTranslatorMode_tooltip: `
		<strong>StellarMaps翻訳者の方へ:</strong>
		<ul>
			<li>Altキーを押しっぱなしでメッセージIDを表示します。</li>
			<li>メッセージに使用する翻訳ファイルを選択します。</li>
			<li>ファイルを編集して保存すると内容が反映されます。</li>
			<li>メッセージの欠落や余分なメッセージについて警告を表示します。</li>
			<li>アプリケーションを再起動する場合は、翻訳ファイルを再選択する必要があります。</li>
		</ul>`,
	},
	map_mode: {
		common: {
			selected_country: '選択中の帝国',
		},
		default: {
			name: '帝国',
		},
		unions: {
			name: '同盟',
		},
		wars: {
			name: '戦争',
			tooltip_label: '戦争状態',
			hostile: '敵対',
			ally: '選択中の戦争の同盟国',
			at_war: '戦争中(無関係)',
			at_peace: '非戦争状態',
		},
		population: {
			name_total: '総POP数',
			name_by_country: '国家ごとのPOP数',
			name_species: '種族のPOP数',
			tooltip_label: 'POP数',
			total: '総POP数',
			country: 'POP数(国別カラー)',
			free_species: '自由民の{species}',
			enslaved_species: '奴隷の{species}',
			other_species: 'その他の種族',
		},
		fleet_power: {
			name_allied_and_hostile: '同盟艦隊と敵対艦隊の艦隊戦力',
			tooltip_label: '艦隊戦力',
			own_fleet: '自国の艦隊',
			own_station: '自国のステーション',
			allied_fleet: '同盟艦隊',
			allied_station: '同盟国のステーション',
			hostile_fleet: '敵対艦隊',
			hostile_station: '敵対国のステーション',
		},
		trade_routes: {
			name: '交易路',
			tooltip_label: '交易価値',
			collected: '回収された交易価値',
			pass_through: '移送中の交易価値',
			pirated: '海賊による減少',
		},
		authority: {
			name: '統治形態',
			tooltip_label: '統治形態',
		},
		relations: {
			name: '関係',
			tooltip_label: '関係',
		},
	},
	legend: {
		fully_occupied: '完全な占領',
		partially_occupied: '部分的な占領',
	},
};
