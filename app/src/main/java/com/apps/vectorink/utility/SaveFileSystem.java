package com.apps.vectorink.utility;

import android.util.Base64;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;

public class SaveFileSystem
{
	public void saveToFileOtherSVG(String base64Data, String filePath)
	{
		try {
	        // Buat file dan tulis byte array ke dalamnya
			byte[] data64 = Base64.decode(base64Data,Base64.DEFAULT);
			
	        File file = new File(filePath);
	        FileOutputStream fos = new FileOutputStream(file);
	        fos.write(data64);
	        fos.close();
		} catch(Exception err) {
			err.printStackTrace();
		}
	}
	
	public void saveToFileSVG(String svgString, String filePath)
	{
		try {
	        // Buat file dan tulis byte array ke dalamnya
	        File file = new File(filePath);
	        FileOutputStream fos = new FileOutputStream(file);
	        fos.write(svgString.getBytes());
	        fos.close();
		} catch(Exception err) {
			err.printStackTrace();
		}
	}
	private String createXmlWithBase64(String base64Data) {
	    return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
	           + "<root>\n"
	           + "    <imageData>" + base64Data + "</imageData>\n"
	           + "</root>";
	}
}