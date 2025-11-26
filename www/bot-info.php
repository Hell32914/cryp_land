<?php
header('Content-Type: application/json; charset=utf-8');

// Static bot information (fallback without requiring curl)
// If curl is available, we can fetch dynamic data from t.me
if (function_exists('curl_init')) {
    try {
        $botUrl = 'https://t.me/AiSyntrixTrade_bot';
        $ch = curl_init($botUrl);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            CURLOPT_USERAGENT => 'TelegramPreviewBot/1.0',
            CURLOPT_TIMEOUT => 5
        ]);
        $html = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($html && $httpCode == 200) {
            // Extract og:title
            if (preg_match('/<meta\s+property="og:title"\s+content="([^"]*)"/i', $html, $m)) {
                $title = html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
            }
            // Extract og:description
            if (preg_match('/<meta\s+property="og:description"\s+content="([^"]*)"/i', $html, $m)) {
                $description = html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
            }
            // Extract og:image
            if (preg_match('/<meta\s+property="og:image"\s+content="([^"]*)"/i', $html, $m)) {
                $image = $m[1];
            }
        }
    } catch (Exception $e) {
        // Fallback to static data
    }
}

// Return data (dynamic if fetched, otherwise static fallback)
echo json_encode([
    'success'     => true,
    'name'        => $title ?? 'Syntrix Bot',
    'username'    => '@AiSyntrixTrade_bot',
    'description' => $description ?? 'Welcome to the Syntrix. Profits are no longer random 🤖',
    'avatar'      => $image ?? 'https://cdn4.telegram-cdn.org/file/WzMyNSwiMTc3NjI4MzU4IiwxNzMyNjI1NjQwLCJQaG90by0yMDI0MTEyNl8wNjQ3MjAuanBnIiwiYWE0ZjQxNjY4MSIsNzM4MzcsNjczMjMzMTkyLDM3MzUyNzEzODZd.jpg'
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
