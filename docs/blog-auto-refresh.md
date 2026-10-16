# Blog auto-refresh

When a post is published, updated or taken down on the WordPress subsite
(cms.habitnova.com/russvitale), WordPress tells russvitale.com, and /blog
shows the change on the next visit instead of after the cache runs out.

## 1. Netlify

Add `RUSS_BLOG_WEBHOOK_SECRET` to the site's environment variables: any long
random string (for example the output of `openssl rand -hex 32`). Redeploy.

## 2. WordPress

On the russvitale subsite, add this as a must-use plugin
(`wp-content/mu-plugins/russvitale-refresh.php`) or with the Code Snippets
plugin. Put the same secret in place of `PASTE_SECRET_HERE`.

```php
<?php
/**
 * Plugin Name: russvitale.com refresh
 * Description: Tells russvitale.com to refresh /blog when a post changes.
 */
add_action('transition_post_status', function ($new, $old, $post) {
    if ($post->post_type !== 'post') return;
    if ($new !== 'publish' && $old !== 'publish') return;
    wp_remote_post('https://russvitale.com/api/blog-published', [
        'headers'  => ['X-Russ-Secret' => 'PASTE_SECRET_HERE'],
        'timeout'  => 5,
        'blocking' => false,
    ]);
}, 10, 3);
```

It only fires for posts that are live or were live, so drafts don't call the
site. If the secret is missing or wrong the site answers 503 or 401 and nothing
changes; admin's "Show new blog posts now" still works by hand.
