package com.apps.vectorink.utility;

import android.content.Context;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

public class SqlSystem extends SQLiteOpenHelper
{
	public SqlSystem(Context context, String name, SQLiteDatabase.CursorFactory factory, int version) 
	{
		super(context,name,factory,version);
	}
    @Override
    public void onCreate(SQLiteDatabase db)
	{}

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion)
	{}
}
