package com.apps.vectorink;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

import org.json.JSONArray;

public class DatabaseHelper extends SQLiteOpenHelper {

    public DatabaseHelper(Context context) {
        super(context, "names.db", null, 1);
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        db.execSQL("CREATE TABLE names (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)");
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        db.execSQL("DROP TABLE IF EXISTS names");
        onCreate(db);
    }

    public void insertName(String name) {
        SQLiteDatabase db = this.getWritableDatabase();
        ContentValues values = new ContentValues();
        values.put("name", name);
        db.insert("names", null, values);
        db.close();
    }

    public String getAllNamesAsJson() {
        SQLiteDatabase db = this.getReadableDatabase();
        Cursor cursor = db.rawQuery("SELECT name FROM names", null);

        JSONArray array = new JSONArray();
        while (cursor.moveToNext()) {
            array.put(cursor.getString(0));
        }
        cursor.close();
        db.close();
        return array.toString();
    }
}
