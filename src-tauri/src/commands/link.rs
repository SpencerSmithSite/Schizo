use serde::Serialize;

#[derive(Serialize)]
pub struct LinkPreview {
    pub title: Option<String>,
    pub description: Option<String>,
    pub favicon_url: Option<String>,
    pub preview_image_url: Option<String>,
}

#[tauri::command]
pub async fn fetch_link_preview(url: String) -> Result<LinkPreview, String> {
    use reqwest::header;
    use scraper::{Html, Selector};

    let parsed = url::Url::parse(&url).map_err(|e| e.to_string())?;
    let origin = format!(
        "{}://{}",
        parsed.scheme(),
        parsed.host_str().unwrap_or("")
    );

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(8))
        .user_agent("Mozilla/5.0 (compatible; Schizo/1.0)")
        .build()
        .map_err(|e| e.to_string())?;

    let resp = client
        .get(&url)
        .header(header::ACCEPT, "text/html")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let body = resp.text().await.map_err(|e| e.to_string())?;
    let doc = Html::parse_document(&body);

    let meta_sel = Selector::parse("meta").unwrap();
    let title_sel = Selector::parse("title").unwrap();
    let link_sel = Selector::parse("link[rel~='icon'], link[rel~='shortcut']").unwrap();

    let mut title: Option<String> = None;
    let mut description: Option<String> = None;
    let mut preview_image_url: Option<String> = None;

    // Extract <meta property="og:*"> and <meta name="*">
    for meta in doc.select(&meta_sel) {
        let prop = meta
            .value()
            .attr("property")
            .or_else(|| meta.value().attr("name"))
            .unwrap_or("")
            .to_lowercase();
        let content = meta.value().attr("content").unwrap_or("").trim().to_string();
        if content.is_empty() {
            continue;
        }
        match prop.as_str() {
            "og:title" | "twitter:title" => {
                if title.is_none() {
                    title = Some(content);
                }
            }
            "og:description" | "twitter:description" | "description" => {
                if description.is_none() {
                    description = Some(content);
                }
            }
            "og:image" | "twitter:image" => {
                if preview_image_url.is_none() {
                    let img = resolve_url(&content, &origin);
                    preview_image_url = Some(img);
                }
            }
            _ => {}
        }
    }

    // Fallback to <title>
    if title.is_none() {
        title = doc
            .select(&title_sel)
            .next()
            .map(|el| el.text().collect::<String>().trim().to_string())
            .filter(|s| !s.is_empty());
    }

    // Favicon: prefer <link rel="icon"> href, fall back to /favicon.ico
    let favicon_url = doc
        .select(&link_sel)
        .next()
        .and_then(|el| el.value().attr("href"))
        .map(|href| resolve_url(href, &origin))
        .or_else(|| {
            parsed
                .host_str()
                .map(|h| format!("{}://{}/favicon.ico", parsed.scheme(), h))
        });

    Ok(LinkPreview {
        title,
        description,
        favicon_url,
        preview_image_url,
    })
}

fn resolve_url(href: &str, origin: &str) -> String {
    if href.starts_with("http://") || href.starts_with("https://") {
        href.to_string()
    } else if href.starts_with("//") {
        format!("https:{href}")
    } else if href.starts_with('/') {
        format!("{origin}{href}")
    } else {
        format!("{origin}/{href}")
    }
}
