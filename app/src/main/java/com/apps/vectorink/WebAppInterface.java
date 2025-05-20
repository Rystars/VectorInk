package com.apps.vectorink;

import android.content.Context;
import android.webkit.JavascriptInterface;

public class WebAppInterface {
    Context context;
    DatabaseHelper db;

    WebAppInterface(Context c) {
        context = c;
        db = new DatabaseHelper(c);
    }

    @JavascriptInterface
    public void insertData(String name) {
        db.insertName(name);
    }

    @JavascriptInterface
    public String getAllNames() {
        return db.getAllNamesAsJson();
  
}
}
