package com.apps.vectorink;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.util.Log;
import android.webkit.DownloadListener;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.webkit.WebViewAssetLoader;
import com.apps.vectorink.utility.SaveFileSystem;
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

public class VectorInkView extends Activity
{
	private WebView vectorInk = null;
	
	final WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
         .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
         .addPathHandler("/res/", new WebViewAssetLoader.ResourcesPathHandler(this))
         .build();
	
	public ValueCallback<Uri[]> vc = null;
	
	@Override
	protected void onCreate(Bundle savedInstanceState)
	{
		super.onCreate(savedInstanceState);
		setContentView(R.layout.vectorink);
		
		vectorInk = (WebView)findViewById(R.id.vectorink);
		vectorInk.setWebViewClient(new LocalContentWebViewClient(assetLoader));
		vectorInk.setWebChromeClient(new WebChromeClient(){
			@Override
			public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, WebChromeClient.FileChooserParams fileChooserParams)
			{
				Intent fileChooserIntent = fileChooserParams.createIntent();
				 startActivityForResult( fileChooserIntent, 0);
				 vc = filePathCallback;
				
				return true;
			}
		});
		vectorInk.getSettings().setAllowContentAccess(true);
		vectorInk.getSettings().setAllowFileAccess(true);
		vectorInk.getSettings().setDomStorageEnabled(true);
		vectorInk.getSettings().setJavaScriptEnabled(true);
		vectorInk.getSettings().setAlgorithmicDarkeningAllowed(true);
		vectorInk.getSettings().setJavaScriptCanOpenWindowsAutomatically(true);
		vectorInk.getSettings().setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK);
		vectorInk.getSettings().setLoadsImagesAutomatically(true);
		vectorInk.getSettings().setBuiltInZoomControls(true);
		
		vectorInk.setDownloadListener(new DownloadListener()
		{
			@Override
			public void onDownloadStart(String url, String agent, String contentDisposition, String mimetype, long contentLength)
			{
				String filePath = Environment.getExternalStorageDirectory() + "/Download/" + URLUtil.guessFileName(url,contentDisposition,mimetype);
				String data64 = url;
				String pureEncode64 = data64.substring(data64.indexOf(",")  + 1);
				String extension = data64.substring(data64.indexOf(";")-4,data64.indexOf(";"));

				if(extension.contains("jpeg") || extension.contains("png")) {
					new SaveFileSystem().saveToFileOtherSVG(pureEncode64, filePath);
				}else if(extension.contains("xml")) {
					try {
						String svgString = URLDecoder.decode(pureEncode64,StandardCharsets.UTF_8.name());
						new SaveFileSystem().saveToFileSVG(svgString,Environment.getExternalStorageDirectory() + "/Download/" + "svg.svg");
					} catch(UnsupportedEncodingException err) {
						err.printStackTrace();
					}
				}
			}
		});
		if(savedInstanceState != null) {
			vectorInk.restoreState(savedInstanceState);
		}else{
			vectorInk.loadUrl("https://appassets.androidplatform.net/assets/VectorInk/index.html");
		}
	}
	
	@Override
	protected void onSaveInstanceState(Bundle save) 
	{
		super.onSaveInstanceState(save);
		// TODO: Implement this method
		vectorInk.saveState(save);
	}
	
	@Override
	protected void onActivityResult(int requestCode, int resultCode, Intent data)
	{
		Uri[] selectedFileUri = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
		vc.onReceiveValue( selectedFileUri);
	}
}