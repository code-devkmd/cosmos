import { useEffect, useState } from "react";

import "./App.css";

import Icon from "./components/Icon.jsx";

import {
	NASA_SEARCH_URL,
	MEDIA_TYPES,
	DISCOVERY_TOPICS,
} from "./data/constants.js";

import { getItemInfo } from "./lib/nasa.js";

import { readSavedItems, writeSavedItems } from "./lib/storage.js";

export default function App() {
	const [query, setQuery] = useState("");

	const [submittedQuery, setSubmittedQuery] = useState("");

	const [mediaType, setMediaType] = useState("image");

	const [results, setResults] = useState([]);

	const [loading, setLoading] = useState(false);

	const [loadingMore, setLoadingMore] = useState(false);

	const [error, setError] = useState("");

	const [page, setPage] = useState(1);

	const [hasMore, setHasMore] = useState(false);

	const [savedItems, setSavedItems] = useState(readSavedItems);

	const [showSaved, setShowSaved] = useState(false);

	const [selectedItem, setSelectedItem] = useState(null);

	const [assetData, setAssetData] = useState(null);

	const savedIds = new Set(savedItems.map((item) => getItemInfo(item).id));

	const visibleItems = showSaved ? savedItems : results;

	const search = async (term, type = mediaType, nextPage = 1) => {
		const cleanTerm = term.trim();

		if (!cleanTerm) return;

		if (nextPage === 1) {
			setLoading(true);

			setResults([]);

			setShowSaved(false);
		} else {
			setLoadingMore(true);
		}

		setError("");

		setSubmittedQuery(cleanTerm);

		setPage(nextPage);

		try {
			const params = new URLSearchParams({
				q: cleanTerm,

				media_type: type,

				page: String(nextPage),
			});

			const response = await fetch(`${NASA_SEARCH_URL}?${params}`);

			if (!response.ok)
				throw new Error(
					`NASA search is unavailable right now (${response.status}).`,
				);

			const data = await response.json();

			const collection = data.collection || {};

			const items = collection.items || [];

			setResults((current) =>
				nextPage === 1 ? items : [...current, ...items],
			);

			const totalHits = Number(collection.metadata?.total_hits || 0);

			setHasMore(nextPage * 100 < totalHits && items.length > 0);
		} catch (searchError) {
			setError(
				searchError.message ||
					"We couldn't reach the NASA image library. Please try again.",
			);
		} finally {
			setLoading(false);

			setLoadingMore(false);
		}
	};

	const handleSubmit = (event) => {
		event.preventDefault();

		search(query);
	};

	const selectMediaType = (type) => {
		setMediaType(type);

		if (submittedQuery) search(submittedQuery, type);
	};

	const toggleSaved = (item) => {
		const id = getItemInfo(item).id;

		setSavedItems((current) => {
			const next = current.some((saved) => getItemInfo(saved).id === id)
				? current.filter((saved) => getItemInfo(saved).id !== id)
				: [item, ...current];

			writeSavedItems(next);

			return next;
		});
	};

	useEffect(() => {
		if (!selectedItem) return undefined;

		const controller = new AbortController();

		const info = getItemInfo(selectedItem);

		if (info.mediaType === "image" || !selectedItem.href)
			return () => controller.abort();

		fetch(selectedItem.href, { signal: controller.signal })
			.then((response) => {
				if (!response.ok) throw new Error("Could not load the original media.");

				return response.json();
			})

			.then((urls) =>
				setAssetData({ id: info.id, urls: Array.isArray(urls) ? urls : [] }),
			)

			.catch((assetError) => {
				if (assetError.name !== "AbortError")
					setAssetData({ id: info.id, urls: [] });
			});

		return () => controller.abort();
	}, [selectedItem]);

	useEffect(() => {
		if (!selectedItem) return undefined;

		const onKeyDown = (event) => {
			if (event.key === "Escape") setSelectedItem(null);
		};

		window.addEventListener("keydown", onKeyDown);

		return () => window.removeEventListener("keydown", onKeyDown);
	}, [selectedItem]);

	const openDetail = (item) => setSelectedItem(item);

	const activeInfo = selectedItem ? getItemInfo(selectedItem) : null;

	const assetUrls =
		assetData && assetData.id === activeInfo?.id ? assetData.urls : [];

	const loadingAssets = Boolean(
		selectedItem &&
		activeInfo?.mediaType !== "image" &&
		selectedItem.href &&
		assetData?.id !== activeInfo.id,
	);

	const playableAsset = assetUrls.find((url) =>
		/\\.(mp4|webm|mp3|wav|m4a)(\\?|$)/i.test(url),
	);

	const isAudio = activeInfo?.mediaType === "audio";

	return (
		<div className="app-shell">
			<div className="star-field" aria-hidden="true" />

			<header className="topbar">
				<a className="brand" href="#top" aria-label="Cosmos home">
					<span className="brand-mark">
						<span />
					</span>

					<span>
						COSMOS<span className="brand-dot">.</span>
					</span>
				</a>

				<div className="topbar-right">
					<span className="live-dot" />

					<span>THE UNIVERSE, OPEN TO EVERYONE</span>

					<button
						className={`saved-nav ${showSaved ? "is-active" : ""}`}
						onClick={() => setShowSaved((value) => !value)}
					>
						<Icon name="bookmark" size={16} /> Saved{" "}
						<span>{savedItems.length}</span>
					</button>
				</div>
			</header>

			<main id="top">
				<section className="hero-section">
					<div className="hero-copy">
						<p className="eyebrow">
							<span>✳</span> YOUR PERSONAL SPACE OBSERVATORY
						</p>

						<h1>
							There’s more
							<br />
							out <em>there.</em>
						</h1>

						<p className="hero-description">
							A universe of NASA imagery, mission footage, and sounds—just one
							curious search away.
						</p>

						<div className="hero-proof">
							<span className="orbit-icon">◎</span>
							<span>Explore the NASA media archive</span>
							<span className="proof-divider" /> <span>Free. Always.</span>
						</div>
					</div>

					<div className="planet-art" aria-hidden="true">
						<div className="planet-orbit orbit-one" />

						<div className="planet-orbit orbit-two" />

						<div className="planet">
							<div className="planet-glow" />
						</div>

						<span className="planet-label">
							JUPITER SYSTEM <i>↗</i>
						</span>

						<span className="planet-spark spark-one">✦</span>

						<span className="planet-spark spark-two">✧</span>
					</div>

					<div className="hero-index">
						<span>01</span>

						<span className="index-line" />

						<span>DISCOVER</span>
					</div>
				</section>

				<section
					className="explorer"
					aria-label="Search the NASA media archive"
				>
					<div className="section-heading">
						<div>
							<p className="eyebrow">START EXPLORING</p>

							<h2>What’s on your mind?</h2>
						</div>

						<p className="section-note">
							Follow a question. See where it takes you.
						</p>
					</div>

					<div className="search-panel">
						<div
							className="media-tabs"
							role="tablist"
							aria-label="Choose media type"
						>
							{MEDIA_TYPES.map((type) => (
								<button
									key={type.id}
									type="button"
									role="tab"
									aria-selected={mediaType === type.id}
									className={`media-tab ${mediaType === type.id ? "is-selected" : ""}`}
									onClick={() => selectMediaType(type.id)}
								>
									<span className="tab-symbol">{type.symbol}</span>

									{type.label}
								</button>
							))}
						</div>

						<form className="search-form" onSubmit={handleSubmit}>
							<Icon name="search" size={21} />

							<input
								aria-label="Search NASA's archive"
								value={query}
								onChange={(event) => setQuery(event.target.value)}
								placeholder="Try ‘the first moon landing’ or ‘rings of Saturn’"
							/>

							<button type="submit" disabled={loading || !query.trim()}>
								{loading ? (
									<span className="button-spinner" />
								) : (
									<>
										Explore <Icon name="arrow" size={17} />
									</>
								)}
							</button>
						</form>

						<div className="topic-row">
							<span className="topic-label">A little inspiration</span>

							{DISCOVERY_TOPICS.map((topic) => (
								<button
									key={topic}
									type="button"
									className="topic-chip"
									onClick={() => {
										setQuery(topic);

										search(topic);
									}}
								>
									{topic}

									<span>↗</span>
								</button>
							))}
						</div>
					</div>
				</section>

				<section className="results-section" aria-live="polite">
					<div className="results-heading">
						<div>
							<p className="eyebrow">
								{showSaved
									? "YOUR COLLECTION"
									: submittedQuery
										? "FROM THE NASA ARCHIVE"
										: "A FEW PLACES TO BEGIN"}
							</p>

							<h2>
								{showSaved ? (
									"Saved discoveries"
								) : submittedQuery ? (
									<>
										Results for <em>“{submittedQuery}”</em>
									</>
								) : (
									"Curiosity looks good on you."
								)}
							</h2>
						</div>

						{!showSaved && submittedQuery && !loading && (
							<span className="results-count">
								{results.length}{" "}
								{results.length === 1 ? "discovery" : "discoveries"}
							</span>
						)}
					</div>

					{error && (
						<div className="error-banner" role="alert">
							<span>!</span>

							<div>
								<strong>We lost our signal.</strong>

								<p>{error}</p>
							</div>

							<button onClick={() => search(submittedQuery || query)}>
								Try again
							</button>
						</div>
					)}

					{loading && (
						<div className="loading-state">
							<div className="loading-orbit">
								<span />
							</div>

							<p>
								Scanning the archive<span className="loading-dots">...</span>
							</p>

							<small>There’s a lot of universe to look through.</small>
						</div>
					)}

					{!loading && visibleItems.length > 0 && (
						<div className="results-grid">
							{visibleItems.map((item, index) => {
								const info = getItemInfo(item);

								const isSaved = savedIds.has(info.id);

								return (
									<article
										className="result-card"
										key={`${info.id}-${index}`}
										style={{ "--card-index": index }}
									>
										<button
											className="card-image-button"
											type="button"
											onClick={() => openDetail(item)}
											aria-label={`Explore ${info.title}`}
										>
											{info.preview ? (
												<img
													className="card-image"
													src={info.preview}
													alt=""
													loading="lazy"
												/>
											) : (
												<div className={`media-placeholder ${info.mediaType}`}>
													<span>{info.mediaType === "audio" ? "♫" : "✦"}</span>

													<small>NASA {info.mediaType}</small>
												</div>
											)}

											<span className="image-shade" />

											<span className="media-badge">
												{info.mediaType === "video"
													? "▶ VIDEO"
													: info.mediaType === "audio"
														? "♫ AUDIO"
														: "✦ IMAGE"}
											</span>

											<span className="card-open">
												<Icon name="arrow" size={16} />
											</span>
										</button>

										<div className="card-content">
											<div className="card-meta">
												<span>{info.center || "NASA ARCHIVE"}</span>

												{info.date && (
													<time dateTime={info.date}>
														{new Date(info.date).getFullYear()}
													</time>
												)}
											</div>

											<h3>{info.title}</h3>

											<p>{info.description}</p>

											<div className="card-footer">
												<button
													className="detail-link"
													type="button"
													onClick={() => openDetail(item)}
												>
													Explore story <Icon name="arrow" size={15} />
												</button>

												<button
													className={`bookmark-button ${isSaved ? "is-saved" : ""}`}
													type="button"
													aria-label={
														isSaved ? "Remove from saved" : "Save discovery"
													}
													title={
														isSaved ? "Remove from saved" : "Save discovery"
													}
													onClick={() => toggleSaved(item)}
												>
													<Icon name="bookmark" size={17} />
												</button>
											</div>
										</div>
									</article>
								);
							})}
						</div>
					)}

					{!loading && !error && visibleItems.length === 0 && (
						<div className="empty-state">
							<div className="empty-illustration">
								<span>✦</span>

								<i>✧</i>

								<b>·</b>
							</div>

							<h3>
								{showSaved
									? "Your collection is a blank canvas."
									: submittedQuery
										? "No signal from that corner of space."
										: "Every great discovery starts with a question."}
							</h3>

							<p>
								{showSaved
									? "Save a discovery that makes you pause. It’ll be waiting here when you return."
									: submittedQuery
										? "Try a broader search, or pick one of the curiosities above."
										: "What would you like to see, hear, or learn about today?"}
							</p>
						</div>
					)}

					{!showSaved && !loading && hasMore && (
						<div className="load-more-wrap">
							<button
								className="load-more"
								type="button"
								disabled={loadingMore}
								onClick={() => search(submittedQuery, mediaType, page + 1)}
							>
								{loadingMore ? "Finding more…" : "Keep exploring"}

								<Icon name="arrow" size={17} />
							</button>
						</div>
					)}
				</section>

				<section className="closing-note">
					<span className="closing-star">✳</span>

					<div>
						<p className="eyebrow">THE SPACE BETWEEN US</p>

						<h2>
							Made of stardust.
							<br />
							<em>Powered by curiosity.</em>
						</h2>
					</div>

					<p>
						Every image, sound, and story here comes from NASA’s public media
						archive. The next discovery is yours.
					</p>
				</section>
			</main>

			<footer className="site-footer">
				<a className="brand footer-brand" href="#top">
					<span className="brand-mark">
						<span />
					</span>

					<span>
						COSMOS<span className="brand-dot">.</span>
					</span>
				</a>

				<span>AN OPEN WINDOW INTO THE UNIVERSE</span>

				<a href="https\://images.nasa.gov/" target="_blank" rel="noreferrer">
					NASA IMAGE AND VIDEO LIBRARY ↗
				</a>
			</footer>

			{selectedItem && activeInfo && (
				<div
					className="modal-backdrop"
					role="presentation"
					onMouseDown={(event) => {
						if (event.target === event.currentTarget) setSelectedItem(null);
					}}
				>
					<section
						className="detail-modal"
						role="dialog"
						aria-modal="true"
						aria-labelledby="modal-title"
					>
						<button
							className="modal-close"
							type="button"
							aria-label="Close details"
							onClick={() => setSelectedItem(null)}
						>
							<Icon name="close" />
						</button>

						<div className="modal-media">
							{playableAsset && isAudio && (
								<audio controls src={playableAsset}>
									Your browser does not support audio playback.
								</audio>
							)}

							{playableAsset && !isAudio && (
								<video
									controls
									autoPlay
									playsInline
									poster={activeInfo.preview}
								>
									<source src={playableAsset} />
									Your browser does not support video playback.
								</video>
							)}

							{!playableAsset && activeInfo.preview && (
								<img src={activeInfo.preview} alt={activeInfo.title} />
							)}

							{loadingAssets && (
								<div className="modal-loading">
									<span className="button-spinner" /> Loading original media…
								</div>
							)}
						</div>

						<div className="modal-copy">
							<p className="eyebrow">
								{activeInfo.center || "NASA ARCHIVE"} ·{" "}
								{activeInfo.mediaType.toUpperCase()}
							</p>

							<h2 id="modal-title">{activeInfo.title}</h2>

							{activeInfo.date && (
								<p className="modal-date">
									Captured{" "}
									{new Date(activeInfo.date).toLocaleDateString(undefined, {
										year: "numeric",

										month: "long",

										day: "numeric",
									})}
								</p>
							)}

							<p className="modal-description">{activeInfo.description}</p>

							<div className="modal-actions">
								<button
									className={`modal-save ${savedIds.has(activeInfo.id) ? "is-saved" : ""}`}
									type="button"
									onClick={() => toggleSaved(selectedItem)}
								>
									<Icon name="bookmark" size={17} />

									{savedIds.has(activeInfo.id)
										? "Saved to your collection"
										: "Save this discovery"}
								</button>

								{!playableAsset && selectedItem.href && (
									<a
										className="modal-external"
										href={selectedItem.href}
										target="_blank"
										rel="noreferrer"
									>
										NASA asset details ↗
									</a>
								)}
							</div>
						</div>
					</section>
				</div>
			)}
		</div>
	);
}
