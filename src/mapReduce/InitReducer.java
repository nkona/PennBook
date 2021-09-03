package mapReduce;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Iterator;

import org.apache.hadoop.io.IntWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Reducer;

public class InitReducer extends Reducer<Text,Text,Text,Text>
{
	public void reduce(Text key, Iterable<Text> values, Context context)
			throws IOException, InterruptedException {
		
		StringBuffer outValue = new StringBuffer();
		int numberOfLinks = 0;
		for (Text v : values)
		{
			outValue.append(v.toString()); //Make list of destination nodes
			outValue.append(",");
			numberOfLinks++;
		}
		outValue.deleteCharAt(outValue.length()-1); //Remove extra comma
		
		outValue.append(";");
		
		double weight = 0;
		if (numberOfLinks != 0)
			weight = (float)1/numberOfLinks;
		outValue.append(weight+"");
		outValue.append(";");
		
		//Initialize adsorption value of 1 for this node
		String[] keyParts = key.toString().split(":");
		if (keyParts[0].equals("user")) {
			outValue.append(keyParts[1]);
			outValue.append(",1");
		}
		
		context.write(key, new Text( outValue.toString() ));
		
	}
}