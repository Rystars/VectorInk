package com.apps.vectorink;

import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.webkit.WebViewAssetLoader;

public class LocalContentWebViewClient extends WebViewClient
{
    private final WebViewAssetLoader mAssetLoader;
    
    LocalContentWebViewClient(WebViewAssetLoader assetLoader)
	{
        mAssetLoader = assetLoader;
    }
	
	@Override
    public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request) 
	{
        return mAssetLoader.shouldInterceptRequest(request.getUrl());
    }
}